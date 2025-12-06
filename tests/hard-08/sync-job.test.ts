/**
 * HARD-08: SyncJob Infrastructure Tests
 *
 * Tests for sync job management, idempotency, progress tracking, and error recording.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/db';
import {
  createSyncJob,
  getSyncJob,
  getSyncJobByIdempotencyKey,
  getDistrictSyncJobs,
  startSyncJob,
  updateProgress,
  completeSyncJob,
  failSyncJob,
  cancelSyncJob,
  recordSyncError,
  getSyncErrors,
  getUnresolvedErrors,
  resolveError,
  getSyncSummary,
  generateIdempotencyKey,
  isValidIdempotencyKey,
  SyncJobNotFoundError,
  InvalidStatusTransitionError,
  type SyncSource,
  type SyncEntityType,
} from '@/lib/sync';

const TEST_DISTRICT = 'test-district';

describe('HARD-08: SyncJob Infrastructure', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.syncError.deleteMany({});
    await prisma.syncJob.deleteMany({});
  });

  afterEach(async () => {
    // Clean up after tests
    await prisma.syncError.deleteMany({});
    await prisma.syncJob.deleteMany({});
  });

  describe('generateIdempotencyKey', () => {
    it('generates deterministic key for same inputs', () => {
      const date = new Date('2025-01-15');
      const key1 = generateIdempotencyKey(
        'lausd',
        'lausd_sis',
        ['users', 'classes'],
        date
      );
      const key2 = generateIdempotencyKey(
        'lausd',
        'lausd_sis',
        ['users', 'classes'],
        date
      );

      expect(key1).toBe(key2);
    });

    it('generates different keys for different dates', () => {
      const key1 = generateIdempotencyKey(
        'lausd',
        'lausd_sis',
        ['users'],
        new Date('2025-01-15')
      );
      const key2 = generateIdempotencyKey(
        'lausd',
        'lausd_sis',
        ['users'],
        new Date('2025-01-16')
      );

      expect(key1).not.toBe(key2);
    });

    it('generates different keys for different sources', () => {
      const date = new Date('2025-01-15');
      const key1 = generateIdempotencyKey('lausd', 'lausd_sis', ['users'], date);
      const key2 = generateIdempotencyKey('lausd', 'clever_api', ['users'], date);

      expect(key1).not.toBe(key2);
    });

    it('generates different keys for different entity types', () => {
      const date = new Date('2025-01-15');
      const key1 = generateIdempotencyKey('lausd', 'lausd_sis', ['users'], date);
      const key2 = generateIdempotencyKey('lausd', 'lausd_sis', ['classes'], date);

      expect(key1).not.toBe(key2);
    });

    it('generates same key regardless of entity type order', () => {
      const date = new Date('2025-01-15');
      const key1 = generateIdempotencyKey('lausd', 'lausd_sis', ['users', 'classes'], date);
      const key2 = generateIdempotencyKey('lausd', 'lausd_sis', ['classes', 'users'], date);

      expect(key1).toBe(key2);
    });

    it('includes date in key format', () => {
      const key = generateIdempotencyKey(
        'lausd',
        'lausd_sis',
        ['users'],
        new Date('2025-01-15')
      );

      expect(key).toContain('2025-01-15');
      expect(key).toContain('lausd');
      expect(key).toContain('lausd_sis');
    });
  });

  describe('isValidIdempotencyKey', () => {
    it('validates generated keys', () => {
      const key = generateIdempotencyKey('lausd', 'lausd_sis', ['users']);
      expect(isValidIdempotencyKey(key)).toBe(true);
    });

    it('validates custom keys with valid format', () => {
      expect(isValidIdempotencyKey('my-custom-sync-key-12345')).toBe(true);
      expect(isValidIdempotencyKey('sync_job_abc_def')).toBe(true);
    });

    it('rejects empty keys', () => {
      expect(isValidIdempotencyKey('')).toBe(false);
    });

    it('rejects keys that are too long', () => {
      const longKey = 'a'.repeat(256);
      expect(isValidIdempotencyKey(longKey)).toBe(false);
    });

    it('rejects keys that are too short', () => {
      expect(isValidIdempotencyKey('short')).toBe(false);
    });
  });

  describe('createSyncJob', () => {
    it('creates a new sync job', async () => {
      const job = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users', 'classes'],
      });

      expect(job.id).toBeDefined();
      expect(job.districtId).toBe(TEST_DISTRICT);
      expect(job.source).toBe('lausd_sis');
      expect(job.entityTypes).toEqual(['users', 'classes']);
      expect(job.status).toBe('pending');
      expect(job.idempotencyKey).toBeDefined();
    });

    it('uses provided idempotency key', async () => {
      const customKey = 'custom-key-12345678';
      const job = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
        idempotencyKey: customKey,
      });

      expect(job.idempotencyKey).toBe(customKey);
    });

    it('returns existing job for duplicate idempotency key (pending)', async () => {
      const customKey = 'duplicate-key-test';

      const job1 = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
        idempotencyKey: customKey,
      });

      const job2 = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
        idempotencyKey: customKey,
      });

      expect(job1.id).toBe(job2.id);
    });

    it('returns existing job for duplicate idempotency key (running)', async () => {
      const customKey = 'running-key-test';

      const job1 = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
        idempotencyKey: customKey,
      });

      await startSyncJob(job1.id);

      const job2 = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
        idempotencyKey: customKey,
      });

      expect(job1.id).toBe(job2.id);
    });

    it('creates new job when existing job is completed', async () => {
      const customKey = 'completed-key-test';

      const job1 = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
        idempotencyKey: customKey,
      });

      await startSyncJob(job1.id);
      await completeSyncJob(job1.id);

      const job2 = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
        idempotencyKey: customKey,
      });

      expect(job2.id).not.toBe(job1.id);
    });

    it('sets totalRecords when provided', async () => {
      const job = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
        totalRecords: 1000,
      });

      expect(job.totalRecords).toBe(1000);
    });
  });

  describe('getSyncJob', () => {
    it('returns sync job by ID', async () => {
      const created = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
      });

      const job = await getSyncJob(created.id);

      expect(job).not.toBeNull();
      expect(job?.id).toBe(created.id);
    });

    it('returns null for unknown ID', async () => {
      const job = await getSyncJob('unknown-id');
      expect(job).toBeNull();
    });
  });

  describe('getSyncJobByIdempotencyKey', () => {
    it('returns sync job by idempotency key', async () => {
      const customKey = 'lookup-key-test';
      const created = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
        idempotencyKey: customKey,
      });

      const job = await getSyncJobByIdempotencyKey(customKey);

      expect(job).not.toBeNull();
      expect(job?.id).toBe(created.id);
    });

    it('returns null for unknown key', async () => {
      const job = await getSyncJobByIdempotencyKey('unknown-key');
      expect(job).toBeNull();
    });
  });

  describe('getDistrictSyncJobs', () => {
    it('returns all jobs for a district', async () => {
      await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
      });
      await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'clever_api',
        entityTypes: ['classes'],
      });
      await createSyncJob({
        districtId: 'other-district',
        source: 'lausd_sis',
        entityTypes: ['users'],
      });

      const jobs = await getDistrictSyncJobs(TEST_DISTRICT);

      expect(jobs.length).toBe(2);
      expect(jobs.every((j) => j.districtId === TEST_DISTRICT)).toBe(true);
    });

    it('filters by status', async () => {
      const job1 = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
      });
      await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'clever_api',
        entityTypes: ['classes'],
      });

      await startSyncJob(job1.id);

      const runningJobs = await getDistrictSyncJobs(TEST_DISTRICT, {
        status: 'running',
      });

      expect(runningJobs.length).toBe(1);
      expect(runningJobs[0].id).toBe(job1.id);
    });

    it('supports pagination', async () => {
      for (let i = 0; i < 5; i++) {
        await createSyncJob({
          districtId: TEST_DISTRICT,
          source: 'lausd_sis',
          entityTypes: ['users'],
          idempotencyKey: `pagination-test-${i}`,
        });
      }

      const page1 = await getDistrictSyncJobs(TEST_DISTRICT, { limit: 2 });
      const page2 = await getDistrictSyncJobs(TEST_DISTRICT, { limit: 2, offset: 2 });

      expect(page1.length).toBe(2);
      expect(page2.length).toBe(2);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });

  describe('startSyncJob', () => {
    it('transitions job from pending to running', async () => {
      const created = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
      });

      const started = await startSyncJob(created.id);

      expect(started.status).toBe('running');
      expect(started.startedAt).toBeDefined();
    });

    it('throws error for non-pending job', async () => {
      const created = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
      });

      await startSyncJob(created.id);

      await expect(startSyncJob(created.id)).rejects.toThrow(
        InvalidStatusTransitionError
      );
    });

    it('throws error for unknown job', async () => {
      await expect(startSyncJob('unknown-id')).rejects.toThrow(
        SyncJobNotFoundError
      );
    });
  });

  describe('updateProgress', () => {
    it('updates job progress', async () => {
      const created = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
        totalRecords: 100,
      });

      await startSyncJob(created.id);

      const updated = await updateProgress(created.id, {
        processedRecords: 50,
        createdRecords: 30,
        updatedRecords: 20,
      });

      expect(updated.processedRecords).toBe(50);
      expect(updated.createdRecords).toBe(30);
      expect(updated.updatedRecords).toBe(20);
    });

    it('allows partial updates', async () => {
      const created = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
        totalRecords: 100,
      });

      await startSyncJob(created.id);
      await updateProgress(created.id, { processedRecords: 25 });
      const updated = await updateProgress(created.id, { processedRecords: 50 });

      expect(updated.processedRecords).toBe(50);
      expect(updated.totalRecords).toBe(100);
    });

    it('throws error for non-running job', async () => {
      const created = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
      });

      await expect(
        updateProgress(created.id, { processedRecords: 10 })
      ).rejects.toThrow(InvalidStatusTransitionError);
    });
  });

  describe('completeSyncJob', () => {
    it('transitions job from running to completed', async () => {
      const created = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
      });

      await startSyncJob(created.id);
      const completed = await completeSyncJob(created.id);

      expect(completed.status).toBe('completed');
      expect(completed.completedAt).toBeDefined();
    });

    it('sets final progress on completion', async () => {
      const created = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
      });

      await startSyncJob(created.id);
      const completed = await completeSyncJob(created.id, {
        processedRecords: 100,
        createdRecords: 80,
        updatedRecords: 20,
      });

      expect(completed.processedRecords).toBe(100);
      expect(completed.createdRecords).toBe(80);
      expect(completed.updatedRecords).toBe(20);
    });

    it('throws error for non-running job', async () => {
      const created = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
      });

      await expect(completeSyncJob(created.id)).rejects.toThrow(
        InvalidStatusTransitionError
      );
    });
  });

  describe('failSyncJob', () => {
    it('transitions job to failed', async () => {
      const created = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
      });

      await startSyncJob(created.id);
      const failed = await failSyncJob(created.id, 'Connection lost');

      expect(failed.status).toBe('failed');
      expect(failed.completedAt).toBeDefined();
    });

    it('records failure reason as error', async () => {
      const created = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
      });

      await startSyncJob(created.id);
      await failSyncJob(created.id, 'API timeout');

      const errors = await getSyncErrors(created.id);
      expect(errors.length).toBe(1);
      expect(errors[0].errorMessage).toBe('API timeout');
    });

    it('can fail pending job', async () => {
      const created = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
      });

      const failed = await failSyncJob(created.id, 'Invalid config');

      expect(failed.status).toBe('failed');
    });
  });

  describe('cancelSyncJob', () => {
    it('cancels a pending job', async () => {
      const created = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
      });

      const cancelled = await cancelSyncJob(created.id);

      expect(cancelled.status).toBe('cancelled');
      expect(cancelled.completedAt).toBeDefined();
    });

    it('cancels a running job', async () => {
      const created = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
      });

      await startSyncJob(created.id);
      const cancelled = await cancelSyncJob(created.id);

      expect(cancelled.status).toBe('cancelled');
    });

    it('throws error for completed job', async () => {
      const created = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
      });

      await startSyncJob(created.id);
      await completeSyncJob(created.id);

      await expect(cancelSyncJob(created.id)).rejects.toThrow(
        InvalidStatusTransitionError
      );
    });
  });

  describe('recordSyncError', () => {
    it('records an error for a sync job', async () => {
      const created = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
      });

      const error = await recordSyncError(created.id, {
        entityType: 'user',
        externalId: 'stu-12345',
        errorType: 'validation',
        message: 'Invalid email format',
      });

      expect(error.id).toBeDefined();
      expect(error.entityType).toBe('user');
      expect(error.errorType).toBe('validation');
    });

    it('increments error count on job', async () => {
      const created = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
      });

      await recordSyncError(created.id, {
        entityType: 'user',
        externalId: 'stu-1',
        errorType: 'validation',
        message: 'Error 1',
      });
      await recordSyncError(created.id, {
        entityType: 'user',
        externalId: 'stu-2',
        errorType: 'validation',
        message: 'Error 2',
      });

      const job = await getSyncJob(created.id);
      expect(job?.errorRecords).toBe(2);
    });

    it('stores raw data', async () => {
      const created = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
      });

      const error = await recordSyncError(created.id, {
        entityType: 'user',
        externalId: 'stu-12345',
        errorType: 'validation',
        message: 'Invalid email',
        rawData: JSON.stringify({ field: 'email', value: 'not-an-email' }),
      });

      expect(error.rawData).toBe(JSON.stringify({ field: 'email', value: 'not-an-email' }));
      expect(error.resolved).toBe(false);
    });
  });

  describe('getSyncErrors', () => {
    it('returns errors for a job', async () => {
      const created = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
      });

      await recordSyncError(created.id, {
        entityType: 'user',
        externalId: 'stu-1',
        errorType: 'validation',
        message: 'Error 1',
      });
      await recordSyncError(created.id, {
        entityType: 'class',
        externalId: 'cls-1',
        errorType: 'missing_ref',
        message: 'Error 2',
      });

      const errors = await getSyncErrors(created.id);

      expect(errors.length).toBe(2);
    });

    it('filters by error type', async () => {
      const created = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
      });

      await recordSyncError(created.id, {
        entityType: 'user',
        externalId: 'stu-1',
        errorType: 'validation',
        message: 'Error 1',
      });
      await recordSyncError(created.id, {
        entityType: 'class',
        externalId: 'cls-1',
        errorType: 'missing_ref',
        message: 'Error 2',
      });

      const errors = await getSyncErrors(created.id, { errorType: 'validation' });

      expect(errors.length).toBe(1);
      expect(errors[0].errorType).toBe('validation');
    });
  });

  describe('getUnresolvedErrors', () => {
    it('returns only unresolved errors', async () => {
      const created = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
      });

      const error1 = await recordSyncError(created.id, {
        entityType: 'user',
        externalId: 'stu-1',
        errorType: 'validation',
        message: 'Error 1',
      });
      await recordSyncError(created.id, {
        entityType: 'user',
        externalId: 'stu-2',
        errorType: 'permission',
        message: 'Error 2',
      });

      // Resolve one error
      await resolveError(error1.id, 'manual_fix', 'admin');

      const unresolved = await getUnresolvedErrors(created.id);

      expect(unresolved.length).toBe(1);
      expect(unresolved[0].externalId).toBe('stu-2');
    });
  });

  describe('resolveError', () => {
    it('marks error as resolved', async () => {
      const created = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
      });

      const error = await recordSyncError(created.id, {
        entityType: 'user',
        externalId: 'stu-1',
        errorType: 'validation',
        message: 'Error 1',
      });

      const resolved = await resolveError(error.id, 'skipped', 'test-admin');

      expect(resolved.resolved).toBe(true);
      expect(resolved.resolution).toBe('skipped');
      expect(resolved.resolvedBy).toBe('test-admin');
      expect(resolved.resolvedAt).toBeDefined();
    });
  });

  describe('getSyncSummary', () => {
    it('returns summary statistics for a district', async () => {
      // Create jobs in various states
      const pending = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'lausd_sis',
        entityTypes: ['users'],
      });

      const running = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'clever_api',
        entityTypes: ['classes'],
      });
      await startSyncJob(running.id);
      await updateProgress(running.id, { processedRecords: 50 });

      const completed = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'oneroster_csv',
        entityTypes: ['enrollments'],
      });
      await startSyncJob(completed.id);
      await completeSyncJob(completed.id, { processedRecords: 100 });

      const failed = await createSyncJob({
        districtId: TEST_DISTRICT,
        source: 'classlink_api',
        entityTypes: ['users'],
      });
      await startSyncJob(failed.id);
      await recordSyncError(failed.id, {
        entityType: 'user',
        externalId: 'stu-1',
        errorType: 'validation',
        message: 'Error',
      });
      await failSyncJob(failed.id, 'Too many errors');

      const summary = await getSyncSummary(TEST_DISTRICT);

      expect(summary.total).toBe(4);
      expect(summary.pending).toBe(1);
      expect(summary.running).toBe(1);
      expect(summary.completed).toBe(1);
      expect(summary.failed).toBe(1);
      expect(summary.totalRecordsProcessed).toBe(150);
      expect(summary.lastCompleted).toBeDefined();
    });

    it('returns zeros for empty district', async () => {
      const summary = await getSyncSummary('empty-district');

      expect(summary.total).toBe(0);
      expect(summary.pending).toBe(0);
      expect(summary.running).toBe(0);
      expect(summary.completed).toBe(0);
      expect(summary.lastCompleted).toBeNull();
    });
  });
});

describe('HARD-08: SyncJob Error Classes', () => {
  it('SyncJobNotFoundError includes job ID', () => {
    const error = new SyncJobNotFoundError('job-123');

    expect(error.jobId).toBe('job-123');
    expect(error.name).toBe('SyncJobNotFoundError');
    expect(error.message).toContain('job-123');
  });

  it('InvalidStatusTransitionError includes status info', () => {
    const error = new InvalidStatusTransitionError('pending', 'completed');

    expect(error.currentStatus).toBe('pending');
    expect(error.targetStatus).toBe('completed');
    expect(error.name).toBe('InvalidStatusTransitionError');
    expect(error.message).toContain('pending');
    expect(error.message).toContain('completed');
  });
});

describe('HARD-08: Idempotency (Mitigation #16)', () => {
  beforeEach(async () => {
    await prisma.syncError.deleteMany({});
    await prisma.syncJob.deleteMany({});
  });

  afterEach(async () => {
    await prisma.syncError.deleteMany({});
    await prisma.syncJob.deleteMany({});
  });

  it('prevents duplicate job creation with same idempotency key (pending)', async () => {
    const key = 'idempotency-test-pending';

    const job1 = await createSyncJob({
      districtId: 'lausd',
      source: 'lausd_sis',
      entityTypes: ['users'],
      idempotencyKey: key,
    });

    const job2 = await createSyncJob({
      districtId: 'lausd',
      source: 'lausd_sis',
      entityTypes: ['users'],
      idempotencyKey: key,
    });

    expect(job1.id).toBe(job2.id);

    // Only one job should exist
    const jobs = await getDistrictSyncJobs('lausd');
    expect(jobs.length).toBe(1);
  });

  it('prevents duplicate job creation with same idempotency key (running)', async () => {
    const key = 'idempotency-test-running';

    const job1 = await createSyncJob({
      districtId: 'lausd',
      source: 'lausd_sis',
      entityTypes: ['users'],
      idempotencyKey: key,
    });

    await startSyncJob(job1.id);

    const job2 = await createSyncJob({
      districtId: 'lausd',
      source: 'lausd_sis',
      entityTypes: ['users'],
      idempotencyKey: key,
    });

    expect(job1.id).toBe(job2.id);
  });

  it('allows new job after previous completed', async () => {
    const key = 'idempotency-test-completed';

    const job1 = await createSyncJob({
      districtId: 'lausd',
      source: 'lausd_sis',
      entityTypes: ['users'],
      idempotencyKey: key,
    });

    await startSyncJob(job1.id);
    await completeSyncJob(job1.id);

    const job2 = await createSyncJob({
      districtId: 'lausd',
      source: 'lausd_sis',
      entityTypes: ['users'],
      idempotencyKey: key,
    });

    expect(job2.id).not.toBe(job1.id);
    expect(job2.idempotencyKey).toContain(key);
  });

  it('allows new job after previous failed', async () => {
    const key = 'idempotency-test-failed';

    const job1 = await createSyncJob({
      districtId: 'lausd',
      source: 'lausd_sis',
      entityTypes: ['users'],
      idempotencyKey: key,
    });

    await startSyncJob(job1.id);
    await failSyncJob(job1.id, 'Connection error');

    const job2 = await createSyncJob({
      districtId: 'lausd',
      source: 'lausd_sis',
      entityTypes: ['users'],
      idempotencyKey: key,
    });

    expect(job2.id).not.toBe(job1.id);
  });

  it('idempotency key lookup works correctly', async () => {
    const key = 'lookup-test-key';

    const job = await createSyncJob({
      districtId: 'lausd',
      source: 'lausd_sis',
      entityTypes: ['users'],
      idempotencyKey: key,
    });

    const found = await getSyncJobByIdempotencyKey(key);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(job.id);
  });
});

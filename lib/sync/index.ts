/**
 * Sync Job Infrastructure
 *
 * HARD-08: Implements sync job management for data synchronization.
 * Handles job creation, progress tracking, idempotency, and error recording.
 *
 * ## Idempotency (Mitigation #16)
 *
 * Each sync job must have a unique idempotency key. Duplicate requests
 * with the same key return the existing job instead of creating a new one.
 *
 * ## Usage
 *
 * ```typescript
 * import { createSyncJob, updateProgress, recordSyncError } from '@/lib/sync';
 *
 * // Create a sync job with idempotency key
 * const job = await createSyncJob({
 *   districtId: 'lausd',
 *   source: 'lausd_sis',
 *   entityTypes: ['users', 'classes'],
 *   idempotencyKey: 'sync-lausd-2025-01-01-users-classes',
 * });
 *
 * // Update progress
 * await updateProgress(job.id, {
 *   processedRecords: 100,
 *   createdRecords: 50,
 *   updatedRecords: 50,
 * });
 *
 * // Record errors
 * await recordSyncError(job.id, {
 *   entityType: 'user',
 *   externalId: 'stu-12345',
 *   errorType: 'validation',
 *   message: 'Invalid email format',
 * });
 * ```
 *
 * @module lib/sync
 */

import { prisma } from '@/lib/db';
import crypto from 'crypto';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Sync data sources
 */
export type SyncSource = 'lausd_sis' | 'clever_api' | 'oneroster_csv' | 'classlink_api' | 'manual';

/**
 * Sync job status
 */
export type SyncJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Entity types that can be synced
 */
export type SyncEntityType =
  | 'users'
  | 'schools'
  | 'classes'
  | 'enrollments'
  | 'courses'
  | 'academic_sessions'
  | 'demographics';

/**
 * Error types during sync
 */
export type SyncErrorType = 'validation' | 'conflict' | 'missing_ref' | 'permission' | 'unknown';

/**
 * Input for creating a sync job
 */
export interface CreateSyncJobInput {
  districtId: string;
  source: SyncSource;
  entityTypes: SyncEntityType[];
  idempotencyKey?: string;
  totalRecords?: number;
}

/**
 * Progress update for a sync job
 */
export interface SyncProgressUpdate {
  totalRecords?: number;
  processedRecords?: number;
  createdRecords?: number;
  updatedRecords?: number;
  errorRecords?: number;
}

/**
 * Input for recording a sync error
 */
export interface SyncErrorInput {
  entityType: string;
  externalId: string;
  errorType: SyncErrorType;
  message: string;
  rawData?: string;
}

/**
 * Sync job summary
 */
export interface SyncJob {
  id: string;
  districtId: string;
  source: SyncSource;
  entityTypes: SyncEntityType[];
  status: SyncJobStatus;
  idempotencyKey: string;
  totalRecords: number;
  processedRecords: number;
  createdRecords: number;
  updatedRecords: number;
  errorRecords: number;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

/**
 * Sync error record
 */
export interface SyncError {
  id: string;
  syncJobId: string;
  entityType: string;
  externalId: string;
  errorType: SyncErrorType;
  errorMessage: string;
  rawData: string | null;
  resolved: boolean;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  resolution: string | null;
  createdAt: Date;
}

// =============================================================================
// IDEMPOTENCY KEY GENERATION
// =============================================================================

/**
 * Generate an idempotency key for a sync job
 *
 * Format: sync-{districtId}-{date}-{source}-{entityTypes-hash}
 *
 * @param districtId - The district being synced
 * @param source - The data source
 * @param entityTypes - Entity types being synced
 * @param date - Optional date (defaults to today)
 */
export function generateIdempotencyKey(
  districtId: string,
  source: SyncSource,
  entityTypes: SyncEntityType[],
  date?: Date
): string {
  const d = date || new Date();
  const dateStr = d.toISOString().split('T')[0];
  const sortedTypes = [...entityTypes].sort().join('-');
  const hash = crypto.createHash('sha256').update(sortedTypes).digest('hex').slice(0, 8);

  return `sync-${districtId}-${dateStr}-${source}-${hash}`;
}

/**
 * Validate an idempotency key format
 */
export function isValidIdempotencyKey(key: string): boolean {
  // Must be non-empty string, max 255 chars
  if (!key || typeof key !== 'string' || key.length > 255) {
    return false;
  }

  // Must match expected format or be a custom key
  const syncKeyPattern = /^sync-[\w-]+-\d{4}-\d{2}-\d{2}-[\w-]+-[a-f0-9]{8}$/;
  const customKeyPattern = /^[\w-]{8,255}$/;

  return syncKeyPattern.test(key) || customKeyPattern.test(key);
}

// =============================================================================
// SYNC JOB OPERATIONS
// =============================================================================

/**
 * Create a new sync job with idempotency support
 *
 * If a job with the same idempotency key already exists:
 * - If pending/running: returns existing job
 * - If completed/failed/cancelled: creates new job
 *
 * @param input - Sync job creation parameters
 * @returns Created or existing sync job
 */
export async function createSyncJob(input: CreateSyncJobInput): Promise<SyncJob> {
  const idempotencyKey =
    input.idempotencyKey ||
    generateIdempotencyKey(input.districtId, input.source, input.entityTypes);

  // Check for existing job with same idempotency key
  const existing = await prisma.syncJob.findUnique({
    where: { idempotencyKey },
  });

  if (existing) {
    // Return existing job if it's still active
    if (existing.status === 'pending' || existing.status === 'running') {
      return toSyncJob(existing);
    }
    // Otherwise, we need a new key since this one is "used"
    // Append timestamp to make it unique
    const newKey = `${idempotencyKey}-${Date.now()}`;
    const job = await prisma.syncJob.create({
      data: {
        districtId: input.districtId,
        source: input.source,
        entityTypes: JSON.stringify(input.entityTypes),
        idempotencyKey: newKey,
        status: 'pending',
        totalRecords: input.totalRecords || 0,
      },
    });
    return toSyncJob(job);
  }

  // Create new job
  const job = await prisma.syncJob.create({
    data: {
      districtId: input.districtId,
      source: input.source,
      entityTypes: JSON.stringify(input.entityTypes),
      idempotencyKey,
      status: 'pending',
      totalRecords: input.totalRecords || 0,
    },
  });

  return toSyncJob(job);
}

/**
 * Get a sync job by ID
 */
export async function getSyncJob(jobId: string): Promise<SyncJob | null> {
  const job = await prisma.syncJob.findUnique({
    where: { id: jobId },
  });

  return job ? toSyncJob(job) : null;
}

/**
 * Get a sync job by idempotency key
 */
export async function getSyncJobByIdempotencyKey(key: string): Promise<SyncJob | null> {
  const job = await prisma.syncJob.findUnique({
    where: { idempotencyKey: key },
  });

  return job ? toSyncJob(job) : null;
}

/**
 * Get all sync jobs for a district
 */
export async function getDistrictSyncJobs(
  districtId: string,
  options?: {
    status?: SyncJobStatus | SyncJobStatus[];
    limit?: number;
    offset?: number;
  }
): Promise<SyncJob[]> {
  const statusFilter = options?.status
    ? Array.isArray(options.status)
      ? { in: options.status }
      : options.status
    : undefined;

  const jobs = await prisma.syncJob.findMany({
    where: {
      districtId,
      status: statusFilter,
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit,
    skip: options?.offset,
  });

  return jobs.map(toSyncJob);
}

/**
 * Start a sync job (transition from pending to running)
 */
export async function startSyncJob(jobId: string): Promise<SyncJob> {
  const job = await prisma.syncJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new SyncJobNotFoundError(jobId);
  }

  if (job.status !== 'pending') {
    throw new InvalidStatusTransitionError(job.status, 'running');
  }

  const updated = await prisma.syncJob.update({
    where: { id: jobId },
    data: {
      status: 'running',
      startedAt: new Date(),
    },
  });

  return toSyncJob(updated);
}

/**
 * Update sync job progress
 */
export async function updateProgress(jobId: string, progress: SyncProgressUpdate): Promise<SyncJob> {
  const job = await prisma.syncJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new SyncJobNotFoundError(jobId);
  }

  if (job.status !== 'running') {
    throw new InvalidStatusTransitionError(job.status, 'progress update');
  }

  const updated = await prisma.syncJob.update({
    where: { id: jobId },
    data: {
      totalRecords: progress.totalRecords ?? job.totalRecords,
      processedRecords: progress.processedRecords ?? job.processedRecords,
      createdRecords: progress.createdRecords ?? job.createdRecords,
      updatedRecords: progress.updatedRecords ?? job.updatedRecords,
      errorRecords: progress.errorRecords ?? job.errorRecords,
    },
  });

  return toSyncJob(updated);
}

/**
 * Complete a sync job (transition from running to completed)
 */
export async function completeSyncJob(
  jobId: string,
  finalProgress?: SyncProgressUpdate
): Promise<SyncJob> {
  const job = await prisma.syncJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new SyncJobNotFoundError(jobId);
  }

  if (job.status !== 'running') {
    throw new InvalidStatusTransitionError(job.status, 'completed');
  }

  const updated = await prisma.syncJob.update({
    where: { id: jobId },
    data: {
      status: 'completed',
      completedAt: new Date(),
      totalRecords: finalProgress?.totalRecords ?? job.totalRecords,
      processedRecords: finalProgress?.processedRecords ?? job.processedRecords,
      createdRecords: finalProgress?.createdRecords ?? job.createdRecords,
      updatedRecords: finalProgress?.updatedRecords ?? job.updatedRecords,
      errorRecords: finalProgress?.errorRecords ?? job.errorRecords,
    },
  });

  return toSyncJob(updated);
}

/**
 * Fail a sync job (transition from running to failed)
 */
export async function failSyncJob(jobId: string, reason?: string): Promise<SyncJob> {
  const job = await prisma.syncJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new SyncJobNotFoundError(jobId);
  }

  if (job.status !== 'running' && job.status !== 'pending') {
    throw new InvalidStatusTransitionError(job.status, 'failed');
  }

  // Record the failure reason as an error
  if (reason) {
    await prisma.syncError.create({
      data: {
        syncJobId: jobId,
        entityType: 'job',
        externalId: jobId,
        errorType: 'unknown',
        errorMessage: reason,
      },
    });
  }

  const updated = await prisma.syncJob.update({
    where: { id: jobId },
    data: {
      status: 'failed',
      completedAt: new Date(),
    },
  });

  return toSyncJob(updated);
}

/**
 * Cancel a sync job (transition from pending/running to cancelled)
 */
export async function cancelSyncJob(jobId: string): Promise<SyncJob> {
  const job = await prisma.syncJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new SyncJobNotFoundError(jobId);
  }

  if (job.status !== 'running' && job.status !== 'pending') {
    throw new InvalidStatusTransitionError(job.status, 'cancelled');
  }

  const updated = await prisma.syncJob.update({
    where: { id: jobId },
    data: {
      status: 'cancelled',
      completedAt: new Date(),
    },
  });

  return toSyncJob(updated);
}

// =============================================================================
// SYNC ERROR OPERATIONS
// =============================================================================

/**
 * Record an error during sync
 */
export async function recordSyncError(
  jobId: string,
  error: SyncErrorInput
): Promise<SyncError> {
  const job = await prisma.syncJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new SyncJobNotFoundError(jobId);
  }

  const record = await prisma.syncError.create({
    data: {
      syncJobId: jobId,
      entityType: error.entityType,
      externalId: error.externalId,
      errorType: error.errorType,
      errorMessage: error.message,
      rawData: error.rawData ?? null,
    },
  });

  // Increment error count
  await prisma.syncJob.update({
    where: { id: jobId },
    data: {
      errorRecords: { increment: 1 },
    },
  });

  return toSyncError(record);
}

/**
 * Get errors for a sync job
 */
export async function getSyncErrors(
  jobId: string,
  options?: {
    errorType?: SyncErrorType;
    limit?: number;
    offset?: number;
  }
): Promise<SyncError[]> {
  const errors = await prisma.syncError.findMany({
    where: {
      syncJobId: jobId,
      errorType: options?.errorType,
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit,
    skip: options?.offset,
  });

  return errors.map(toSyncError);
}

/**
 * Get unresolved errors for a sync job (can be retried)
 */
export async function getUnresolvedErrors(jobId: string): Promise<SyncError[]> {
  const errors = await prisma.syncError.findMany({
    where: {
      syncJobId: jobId,
      resolved: false,
    },
    orderBy: { createdAt: 'asc' },
  });

  return errors.map(toSyncError);
}

/**
 * Mark an error as resolved
 */
export async function resolveError(
  errorId: string,
  resolution: 'skipped' | 'manual_fix' | 'auto_retry',
  resolvedBy?: string
): Promise<SyncError> {
  const record = await prisma.syncError.update({
    where: { id: errorId },
    data: {
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy: resolvedBy ?? 'system',
      resolution,
    },
  });

  return toSyncError(record);
}

// =============================================================================
// SUMMARY & STATISTICS
// =============================================================================

/**
 * Get sync job summary statistics for a district
 */
export async function getSyncSummary(districtId: string): Promise<{
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
  lastCompleted: Date | null;
  totalRecordsProcessed: number;
  totalErrors: number;
}> {
  const [stats, lastCompleted, totals] = await Promise.all([
    prisma.syncJob.groupBy({
      by: ['status'],
      where: { districtId },
      _count: true,
    }),
    prisma.syncJob.findFirst({
      where: { districtId, status: 'completed' },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true },
    }),
    prisma.syncJob.aggregate({
      where: { districtId },
      _sum: {
        processedRecords: true,
        errorRecords: true,
      },
    }),
  ]);

  const statusCounts = stats.reduce(
    (acc, s) => {
      acc[s.status as SyncJobStatus] = s._count;
      return acc;
    },
    {} as Record<SyncJobStatus, number>
  );

  return {
    total: stats.reduce((sum, s) => sum + s._count, 0),
    pending: statusCounts.pending || 0,
    running: statusCounts.running || 0,
    completed: statusCounts.completed || 0,
    failed: statusCounts.failed || 0,
    cancelled: statusCounts.cancelled || 0,
    lastCompleted: lastCompleted?.completedAt || null,
    totalRecordsProcessed: totals._sum.processedRecords || 0,
    totalErrors: totals._sum.errorRecords || 0,
  };
}

// =============================================================================
// ERRORS
// =============================================================================

/**
 * Error thrown when sync job is not found
 */
export class SyncJobNotFoundError extends Error {
  constructor(public jobId: string) {
    super(`Sync job not found: ${jobId}`);
    this.name = 'SyncJobNotFoundError';
  }
}

/**
 * Error thrown for invalid status transitions
 */
export class InvalidStatusTransitionError extends Error {
  constructor(
    public currentStatus: string,
    public targetStatus: string
  ) {
    super(`Cannot transition from '${currentStatus}' to '${targetStatus}'`);
    this.name = 'InvalidStatusTransitionError';
  }
}

/**
 * Error thrown for duplicate idempotency key
 */
export class DuplicateIdempotencyKeyError extends Error {
  constructor(public key: string) {
    super(`Sync job with idempotency key already exists: ${key}`);
    this.name = 'DuplicateIdempotencyKeyError';
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert database record to SyncJob type
 */
function toSyncJob(record: {
  id: string;
  districtId: string;
  source: string;
  entityTypes: string;
  status: string;
  idempotencyKey: string;
  totalRecords: number;
  processedRecords: number;
  createdRecords: number;
  updatedRecords: number;
  errorRecords: number;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}): SyncJob {
  return {
    id: record.id,
    districtId: record.districtId,
    source: record.source as SyncSource,
    entityTypes: JSON.parse(record.entityTypes) as SyncEntityType[],
    status: record.status as SyncJobStatus,
    idempotencyKey: record.idempotencyKey,
    totalRecords: record.totalRecords,
    processedRecords: record.processedRecords,
    createdRecords: record.createdRecords,
    updatedRecords: record.updatedRecords,
    errorRecords: record.errorRecords,
    startedAt: record.startedAt,
    completedAt: record.completedAt,
    createdAt: record.createdAt,
  };
}

/**
 * Convert database record to SyncError type
 */
function toSyncError(record: {
  id: string;
  syncJobId: string;
  entityType: string;
  externalId: string;
  errorType: string;
  errorMessage: string;
  rawData: string | null;
  resolved: boolean;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  resolution: string | null;
  createdAt: Date;
}): SyncError {
  return {
    id: record.id,
    syncJobId: record.syncJobId,
    entityType: record.entityType,
    externalId: record.externalId,
    errorType: record.errorType as SyncErrorType,
    errorMessage: record.errorMessage,
    rawData: record.rawData,
    resolved: record.resolved,
    resolvedAt: record.resolvedAt,
    resolvedBy: record.resolvedBy,
    resolution: record.resolution,
    createdAt: record.createdAt,
  };
}

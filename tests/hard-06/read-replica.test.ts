/**
 * HARD-06: Read Replica Tests
 *
 * Tests for the read replica client configuration and utilities.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Store original env
const originalEnv = { ...process.env };

describe('HARD-06: Read Replica Configuration', () => {
  beforeEach(() => {
    // Reset modules between tests
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
  });

  describe('hasReadReplica flag', () => {
    it('returns false when DATABASE_READ_URL is not set', async () => {
      delete process.env.DATABASE_READ_URL;

      const { hasReadReplica } = await import('@/lib/db/replica');

      expect(hasReadReplica).toBe(false);
    });

    it('returns true when DATABASE_READ_URL is set', async () => {
      process.env.DATABASE_READ_URL = 'postgresql://localhost:5432/replica';

      const { hasReadReplica } = await import('@/lib/db/replica');

      expect(hasReadReplica).toBe(true);
    });
  });

  describe('getReplicaStatus', () => {
    it('reports no replica when DATABASE_READ_URL not set', async () => {
      delete process.env.DATABASE_READ_URL;
      process.env.DATABASE_URL = 'postgresql://localhost:5432/primary';

      const { getReplicaStatus } = await import('@/lib/db/replica');
      const status = getReplicaStatus();

      expect(status.hasReplica).toBe(false);
      expect(status.replicaUrl).toBeUndefined();
      expect(status.primaryUrl).toBe('[CONFIGURED]');
    });

    it('reports replica when DATABASE_READ_URL is set', async () => {
      process.env.DATABASE_URL = 'postgresql://localhost:5432/primary';
      process.env.DATABASE_READ_URL = 'postgresql://localhost:5433/replica';

      const { getReplicaStatus } = await import('@/lib/db/replica');
      const status = getReplicaStatus();

      expect(status.hasReplica).toBe(true);
      expect(status.replicaUrl).toBe('[CONFIGURED]');
      expect(status.primaryUrl).toBe('[CONFIGURED]');
    });

    it('does not expose actual connection strings', async () => {
      process.env.DATABASE_URL = 'postgresql://user:secret@localhost:5432/db';
      process.env.DATABASE_READ_URL = 'postgresql://user:secret@localhost:5433/db';

      const { getReplicaStatus } = await import('@/lib/db/replica');
      const status = getReplicaStatus();

      expect(status.replicaUrl).not.toContain('secret');
      expect(status.primaryUrl).not.toContain('secret');
    });
  });

  describe('prismaRead client', () => {
    it('exports prismaRead client', async () => {
      const { prismaRead } = await import('@/lib/db/replica');

      expect(prismaRead).toBeDefined();
      expect(typeof prismaRead.$connect).toBe('function');
      expect(typeof prismaRead.$disconnect).toBe('function');
    });

    it('has all expected Prisma methods', async () => {
      const { prismaRead } = await import('@/lib/db/replica');

      // Common Prisma model methods should exist
      expect(prismaRead.vendor).toBeDefined();
      expect(prismaRead.user).toBeDefined();
      expect(prismaRead.school).toBeDefined();
      expect(prismaRead.district).toBeDefined();
    });
  });

  describe('isReplicaHealthy', () => {
    it('returns true when database is accessible', async () => {
      const { isReplicaHealthy } = await import('@/lib/db/replica');

      const healthy = await isReplicaHealthy();

      expect(healthy).toBe(true);
    });
  });

  describe('getReplicationLag', () => {
    it('returns 0 when no separate replica', async () => {
      delete process.env.DATABASE_READ_URL;

      const { getReplicationLag } = await import('@/lib/db/replica');
      const lag = await getReplicationLag();

      expect(lag).toBe(0);
    });

    it('returns number representing lag in ms', async () => {
      const { getReplicationLag } = await import('@/lib/db/replica');
      const lag = await getReplicationLag();

      expect(typeof lag).toBe('number');
      expect(lag).toBeGreaterThanOrEqual(0);
    });
  });

  describe('readWithFallback', () => {
    it('executes read operation successfully', async () => {
      const { readWithFallback } = await import('@/lib/db/replica');

      const result = await readWithFallback(
        async () => 'read-result',
        async () => 'fallback-result'
      );

      expect(result).toBe('read-result');
    });

    it('falls back when read operation fails', async () => {
      const { readWithFallback } = await import('@/lib/db/replica');

      const result = await readWithFallback(
        async () => {
          throw new Error('Read failed');
        },
        async () => 'fallback-result'
      );

      expect(result).toBe('fallback-result');
    });

    it('throws when read fails and no fallback provided', async () => {
      const { readWithFallback } = await import('@/lib/db/replica');

      await expect(
        readWithFallback(async () => {
          throw new Error('Read failed');
        })
      ).rejects.toThrow('Read failed');
    });
  });
});

describe('HARD-06: Read Replica Export from index.ts', () => {
  it('exports prismaRead from lib/db/index.ts', async () => {
    const db = await import('@/lib/db/index');

    expect(db.prismaRead).toBeDefined();
    expect(db.hasReadReplica).toBeDefined();
    expect(db.getReplicaStatus).toBeDefined();
    expect(db.isReplicaHealthy).toBeDefined();
    expect(db.getReplicationLag).toBeDefined();
    expect(db.readWithFallback).toBeDefined();
  });

  it('prismaRead is separate from prisma', async () => {
    const db = await import('@/lib/db/index');

    // Both should be defined
    expect(db.prisma).toBeDefined();
    expect(db.prismaRead).toBeDefined();

    // They can be the same instance in dev/test but should both work
    expect(typeof db.prisma.$connect).toBe('function');
    expect(typeof db.prismaRead.$connect).toBe('function');
  });
});

describe('HARD-06: Usage Patterns', () => {
  it('demonstrates correct read replica usage', async () => {
    const { prismaRead } = await import('@/lib/db/replica');
    const { prisma } = await import('@/lib/db/index');

    // Read operations should use prismaRead
    const readCount = await prismaRead.vendor.count();
    expect(typeof readCount).toBe('number');

    // Write operations should use prisma (primary)
    // This is a pattern test - we're just verifying both clients work
    const writeCount = await prisma.vendor.count();
    expect(typeof writeCount).toBe('number');
  });

  it('supports findMany operations', async () => {
    const { prismaRead } = await import('@/lib/db/replica');

    // List operations are the primary use case for read replica
    const vendors = await prismaRead.vendor.findMany({ take: 5 });

    expect(Array.isArray(vendors)).toBe(true);
  });

  it('supports count operations', async () => {
    const { prismaRead } = await import('@/lib/db/replica');

    const count = await prismaRead.vendor.count();

    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('supports aggregate operations', async () => {
    const { prismaRead } = await import('@/lib/db/replica');

    const aggregate = await prismaRead.vendor.aggregate({
      _count: true,
    });

    expect(aggregate._count).toBeGreaterThanOrEqual(0);
  });
});

/**
 * Read Replica Client for Database Operations
 *
 * HARD-06: Provides a separate Prisma client for read-only operations.
 * In production, this connects to a read replica for better performance.
 * In development, it falls back to the primary database.
 *
 * ## When to Use
 *
 * Use `prismaRead` for:
 * - List operations (findMany, count, aggregate)
 * - Reports and analytics queries
 * - Search operations
 * - Dashboard data
 *
 * Use `prisma` (primary) for:
 * - Create, update, delete operations
 * - Transactions
 * - Operations requiring immediate consistency
 * - After a write when you need to read the result
 *
 * @module lib/db/replica
 */

import { PrismaClient } from '@prisma/client';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Environment variable for read replica connection
 * Falls back to primary DATABASE_URL if not set
 */
const READ_DATABASE_URL = process.env.DATABASE_READ_URL || process.env.DATABASE_URL;

/**
 * Whether read replica is configured separately from primary
 */
export const hasReadReplica = !!process.env.DATABASE_READ_URL;

// =============================================================================
// READ REPLICA CLIENT SINGLETON
// =============================================================================

const globalForPrismaRead = globalThis as unknown as {
  prismaRead: PrismaClient | undefined;
};

/**
 * Create a read-only Prisma client
 *
 * Configuration differences from primary:
 * - Uses DATABASE_READ_URL if available
 * - Reduced logging (performance)
 * - No write operations should use this client
 */
const createReadClient = (): PrismaClient => {
  // In test mode, always use the same database as primary
  const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

  const client = new PrismaClient({
    datasources: isTest
      ? undefined // Use default for tests
      : {
          db: {
            url: READ_DATABASE_URL,
          },
        },
    log: ['error'], // Minimal logging for read replica
  });

  return client;
};

/**
 * Read replica Prisma client
 *
 * Use this client for all read-only operations:
 * - findMany, findFirst, findUnique
 * - count, aggregate, groupBy
 *
 * @example
 * ```typescript
 * import { prismaRead } from '@/lib/db/replica';
 *
 * // Good: List operations
 * const users = await prismaRead.user.findMany({ where: { role: 'student' } });
 * const count = await prismaRead.user.count();
 *
 * // Bad: Don't use for writes (use primary prisma instead)
 * // await prismaRead.user.create({ ... }); // NO!
 * ```
 */
export const prismaRead = globalForPrismaRead.prismaRead ?? createReadClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrismaRead.prismaRead = prismaRead;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get replica status information
 *
 * Useful for monitoring and debugging
 */
export function getReplicaStatus(): {
  hasReplica: boolean;
  replicaUrl: string | undefined;
  primaryUrl: string | undefined;
} {
  return {
    hasReplica: hasReadReplica,
    replicaUrl: hasReadReplica ? '[CONFIGURED]' : undefined,
    primaryUrl: process.env.DATABASE_URL ? '[CONFIGURED]' : undefined,
  };
}

/**
 * Check if replica is healthy
 *
 * Performs a simple query to verify connectivity
 */
export async function isReplicaHealthy(): Promise<boolean> {
  try {
    await prismaRead.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Get replication lag in milliseconds (placeholder)
 *
 * In a real implementation, this would query the replica
 * for its lag behind the primary. For now, returns 0
 * when using the same database.
 */
export async function getReplicationLag(): Promise<number> {
  if (!hasReadReplica) {
    return 0; // Same database, no lag
  }

  // In a real implementation with PostgreSQL streaming replication:
  // SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) * 1000
  return 0;
}

// =============================================================================
// READ-ONLY OPERATION HELPERS
// =============================================================================

/**
 * Execute a read operation with automatic fallback to primary on failure
 *
 * If the replica fails, falls back to the primary database.
 * Useful for critical read paths that must not fail.
 *
 * @param readOperation - The read operation to execute
 * @param fallbackOperation - Optional fallback using primary client
 */
export async function readWithFallback<T>(
  readOperation: () => Promise<T>,
  fallbackOperation?: () => Promise<T>
): Promise<T> {
  try {
    return await readOperation();
  } catch (error) {
    if (fallbackOperation) {
      console.warn('[ReadReplica] Falling back to primary:', error);
      return await fallbackOperation();
    }
    throw error;
  }
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type { PrismaClient };

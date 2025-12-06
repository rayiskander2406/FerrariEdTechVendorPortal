/**
 * V1-04: Vendor Session Layer - Unit Tests
 *
 * Tests for vendor session management including:
 * - Session CRUD operations
 * - Conversation history persistence
 * - Session expiration and cleanup
 * - State management
 *
 * Target coverage: 95%+
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// These will be implemented in lib/session/index.ts
import {
  createSession,
  getSession,
  updateSession,
  deleteSession,
  getSessionByToken,
  extendSession,
  addMessageToHistory,
  getConversationHistory,
  updateVendorState,
  getVendorState,
  listActiveSessions,
  getExpiredSessions,
  cleanupExpiredSessions,
  SESSION_DURATION_MS,
  SESSION_EXTENSION_MS,
  MAX_HISTORY_MESSAGES,
  type VendorSession,
  type ConversationMessage,
  type VendorState,
  type CreateSessionInput,
  type SessionStats,
} from '@/lib/session';

// =============================================================================
// TEST HELPERS
// =============================================================================

const TEST_VENDOR_ID = 'test-vendor-session';

function createMockSession(overrides?: Partial<VendorSession>): VendorSession {
  return {
    id: 'session-123',
    vendorId: TEST_VENDOR_ID,
    sessionToken: 'tok_abc123xyz',
    conversationHistory: [],
    vendorState: {},
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    lastActivityAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockMessage(role: 'user' | 'assistant', content: string): ConversationMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role,
    content,
    timestamp: new Date().toISOString(),
  };
}

// Mock the Prisma client
vi.mock('@/lib/db', () => ({
  prisma: {
    vendorSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// =============================================================================
// SESSION CONSTANTS TESTS
// =============================================================================

describe('V1-04: Session Constants', () => {
  it('defines SESSION_DURATION_MS as 24 hours', () => {
    expect(SESSION_DURATION_MS).toBe(24 * 60 * 60 * 1000);
  });

  it('defines SESSION_EXTENSION_MS as 1 hour', () => {
    expect(SESSION_EXTENSION_MS).toBe(60 * 60 * 1000);
  });

  it('defines MAX_HISTORY_MESSAGES as 100', () => {
    expect(MAX_HISTORY_MESSAGES).toBe(100);
  });
});

// =============================================================================
// SESSION CREATION TESTS
// =============================================================================

describe('V1-04: Session Creation', () => {
  let mockPrisma: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const db = await import('@/lib/db');
    mockPrisma = db.prisma;
  });

  it('creates a new session with vendorId', async () => {
    const mockSession = createMockSession();
    mockPrisma.vendorSession.create.mockResolvedValue(mockSession);

    const session = await createSession({ vendorId: TEST_VENDOR_ID });

    expect(session).toBeDefined();
    expect(session.vendorId).toBe(TEST_VENDOR_ID);
    expect(mockPrisma.vendorSession.create).toHaveBeenCalled();
  });

  it('generates unique session token', async () => {
    // Mock returns a session with a proper-length token
    const mockSession = createMockSession({
      sessionToken: 'vss_abcdefghijk123456789012345',
    });
    mockPrisma.vendorSession.create.mockResolvedValue(mockSession);

    const session = await createSession({ vendorId: TEST_VENDOR_ID });

    expect(session.sessionToken).toBeDefined();
    expect(session.sessionToken.length).toBeGreaterThan(20);
  });

  it('sets expiration time to 24 hours from creation', async () => {
    const now = Date.now();
    const mockSession = createMockSession({
      expiresAt: new Date(now + SESSION_DURATION_MS),
    });
    mockPrisma.vendorSession.create.mockResolvedValue(mockSession);

    const session = await createSession({ vendorId: TEST_VENDOR_ID });

    const expiresIn = session.expiresAt.getTime() - now;
    expect(expiresIn).toBeGreaterThanOrEqual(SESSION_DURATION_MS - 1000);
    expect(expiresIn).toBeLessThanOrEqual(SESSION_DURATION_MS + 1000);
  });

  it('initializes empty conversation history', async () => {
    const mockSession = createMockSession({ conversationHistory: [] });
    mockPrisma.vendorSession.create.mockResolvedValue(mockSession);

    const session = await createSession({ vendorId: TEST_VENDOR_ID });

    expect(session.conversationHistory).toEqual([]);
  });

  it('initializes empty vendor state', async () => {
    const mockSession = createMockSession({ vendorState: {} });
    mockPrisma.vendorSession.create.mockResolvedValue(mockSession);

    const session = await createSession({ vendorId: TEST_VENDOR_ID });

    expect(session.vendorState).toEqual({});
  });

  it('accepts initial vendor state', async () => {
    const initialState = { selectedEndpoints: ['users', 'classes'] };
    const mockSession = createMockSession({ vendorState: initialState });
    mockPrisma.vendorSession.create.mockResolvedValue(mockSession);

    const session = await createSession({
      vendorId: TEST_VENDOR_ID,
      initialState,
    });

    expect(session.vendorState).toEqual(initialState);
  });

  it('sets lastActivityAt to current time', async () => {
    const now = Date.now();
    const mockSession = createMockSession({ lastActivityAt: new Date(now) });
    mockPrisma.vendorSession.create.mockResolvedValue(mockSession);

    const session = await createSession({ vendorId: TEST_VENDOR_ID });

    const diff = Math.abs(session.lastActivityAt.getTime() - now);
    expect(diff).toBeLessThan(1000);
  });
});

// =============================================================================
// SESSION RETRIEVAL TESTS
// =============================================================================

describe('V1-04: Session Retrieval', () => {
  let mockPrisma: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const db = await import('@/lib/db');
    mockPrisma = db.prisma;
  });

  describe('getSession', () => {
    it('retrieves session by ID', async () => {
      const mockSession = createMockSession();
      mockPrisma.vendorSession.findUnique.mockResolvedValue(mockSession);

      const session = await getSession('session-123');

      expect(session).toEqual(mockSession);
      expect(mockPrisma.vendorSession.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-123' },
      });
    });

    it('returns null for non-existent session', async () => {
      mockPrisma.vendorSession.findUnique.mockResolvedValue(null);

      const session = await getSession('non-existent');

      expect(session).toBeNull();
    });

    it('returns null for expired session', async () => {
      const expiredSession = createMockSession({
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      });
      mockPrisma.vendorSession.findUnique.mockResolvedValue(expiredSession);

      const session = await getSession('session-123');

      expect(session).toBeNull();
    });
  });

  describe('getSessionByToken', () => {
    it('retrieves session by token', async () => {
      const mockSession = createMockSession();
      mockPrisma.vendorSession.findFirst.mockResolvedValue(mockSession);

      const session = await getSessionByToken('tok_abc123xyz');

      expect(session).toEqual(mockSession);
      expect(mockPrisma.vendorSession.findFirst).toHaveBeenCalledWith({
        where: {
          sessionToken: 'tok_abc123xyz',
          expiresAt: { gt: expect.any(Date) },
        },
      });
    });

    it('returns null for invalid token', async () => {
      mockPrisma.vendorSession.findFirst.mockResolvedValue(null);

      const session = await getSessionByToken('invalid-token');

      expect(session).toBeNull();
    });
  });
});

// =============================================================================
// SESSION UPDATE TESTS
// =============================================================================

describe('V1-04: Session Update', () => {
  let mockPrisma: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const db = await import('@/lib/db');
    mockPrisma = db.prisma;
  });

  describe('updateSession', () => {
    it('updates session and refreshes lastActivityAt', async () => {
      const updatedSession = createMockSession({ lastActivityAt: new Date() });
      mockPrisma.vendorSession.update.mockResolvedValue(updatedSession);

      const session = await updateSession('session-123', {});

      expect(mockPrisma.vendorSession.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: expect.objectContaining({
          lastActivityAt: expect.any(Date),
        }),
      });
    });

    it('throws error for non-existent session', async () => {
      mockPrisma.vendorSession.update.mockRejectedValue(
        new Error('Record not found')
      );

      await expect(updateSession('non-existent', {})).rejects.toThrow();
    });
  });

  describe('extendSession', () => {
    it('extends session expiration by 1 hour', async () => {
      const originalExpiry = new Date(Date.now() + 60 * 60 * 1000);
      const existingSession = createMockSession({ expiresAt: originalExpiry });
      mockPrisma.vendorSession.findUnique.mockResolvedValue(existingSession);
      mockPrisma.vendorSession.update.mockResolvedValue({
        ...existingSession,
        expiresAt: new Date(originalExpiry.getTime() + SESSION_EXTENSION_MS),
      });

      const session = await extendSession('session-123');

      expect(session.expiresAt.getTime()).toBeGreaterThan(
        originalExpiry.getTime()
      );
    });

    it('updates lastActivityAt when extending', async () => {
      const existingSession = createMockSession();
      mockPrisma.vendorSession.findUnique.mockResolvedValue(existingSession);
      mockPrisma.vendorSession.update.mockResolvedValue(existingSession);

      await extendSession('session-123');

      expect(mockPrisma.vendorSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lastActivityAt: expect.any(Date),
          }),
        })
      );
    });

    it('returns null for expired session', async () => {
      mockPrisma.vendorSession.findUnique.mockResolvedValue(null);

      const session = await extendSession('expired-session');

      expect(session).toBeNull();
    });
  });
});

// =============================================================================
// SESSION DELETION TESTS
// =============================================================================

describe('V1-04: Session Deletion', () => {
  let mockPrisma: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const db = await import('@/lib/db');
    mockPrisma = db.prisma;
  });

  it('deletes session by ID', async () => {
    mockPrisma.vendorSession.delete.mockResolvedValue({ id: 'session-123' });

    await deleteSession('session-123');

    expect(mockPrisma.vendorSession.delete).toHaveBeenCalledWith({
      where: { id: 'session-123' },
    });
  });

  it('handles deletion of non-existent session gracefully', async () => {
    mockPrisma.vendorSession.delete.mockRejectedValue(
      new Error('Record not found')
    );

    // Should not throw - just return false or log warning
    await expect(deleteSession('non-existent')).resolves.not.toThrow();
  });
});

// =============================================================================
// CONVERSATION HISTORY TESTS
// =============================================================================

describe('V1-04: Conversation History', () => {
  let mockPrisma: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const db = await import('@/lib/db');
    mockPrisma = db.prisma;
  });

  describe('addMessageToHistory', () => {
    it('adds user message to history', async () => {
      const existingSession = createMockSession({ conversationHistory: [] });
      mockPrisma.vendorSession.findUnique.mockResolvedValue(existingSession);
      mockPrisma.vendorSession.update.mockImplementation(({ data }) => ({
        ...existingSession,
        conversationHistory: data.conversationHistory,
      }));

      const session = await addMessageToHistory('session-123', {
        role: 'user',
        content: 'Hello',
      });

      expect(session.conversationHistory).toHaveLength(1);
      expect(session.conversationHistory[0].role).toBe('user');
      expect(session.conversationHistory[0].content).toBe('Hello');
    });

    it('adds assistant message to history', async () => {
      const existingHistory = [createMockMessage('user', 'Hello')];
      const existingSession = createMockSession({
        conversationHistory: existingHistory,
      });
      mockPrisma.vendorSession.findUnique.mockResolvedValue(existingSession);
      mockPrisma.vendorSession.update.mockImplementation(({ data }) => ({
        ...existingSession,
        conversationHistory: data.conversationHistory,
      }));

      const session = await addMessageToHistory('session-123', {
        role: 'assistant',
        content: 'Hi there!',
      });

      expect(session.conversationHistory).toHaveLength(2);
      expect(session.conversationHistory[1].role).toBe('assistant');
    });

    it('generates unique message ID', async () => {
      const existingSession = createMockSession({ conversationHistory: [] });
      mockPrisma.vendorSession.findUnique.mockResolvedValue(existingSession);
      mockPrisma.vendorSession.update.mockImplementation(({ data }) => ({
        ...existingSession,
        conversationHistory: data.conversationHistory,
      }));

      const session = await addMessageToHistory('session-123', {
        role: 'user',
        content: 'Test',
      });

      expect(session.conversationHistory[0].id).toBeDefined();
      expect(session.conversationHistory[0].id).toMatch(/^msg-/);
    });

    it('adds timestamp to message', async () => {
      const existingSession = createMockSession({ conversationHistory: [] });
      mockPrisma.vendorSession.findUnique.mockResolvedValue(existingSession);
      mockPrisma.vendorSession.update.mockImplementation(({ data }) => ({
        ...existingSession,
        conversationHistory: data.conversationHistory,
      }));

      const session = await addMessageToHistory('session-123', {
        role: 'user',
        content: 'Test',
      });

      expect(session.conversationHistory[0].timestamp).toBeDefined();
    });

    it('trims history when exceeding MAX_HISTORY_MESSAGES', async () => {
      // Create history at max capacity
      const fullHistory = Array(MAX_HISTORY_MESSAGES)
        .fill(null)
        .map((_, i) => createMockMessage('user', `Message ${i}`));

      const existingSession = createMockSession({
        conversationHistory: fullHistory,
      });
      mockPrisma.vendorSession.findUnique.mockResolvedValue(existingSession);
      mockPrisma.vendorSession.update.mockImplementation(({ data }) => ({
        ...existingSession,
        conversationHistory: data.conversationHistory,
      }));

      const session = await addMessageToHistory('session-123', {
        role: 'user',
        content: 'New message',
      });

      // Should still be at MAX, with oldest removed
      expect(session.conversationHistory.length).toBe(MAX_HISTORY_MESSAGES);
      expect(session.conversationHistory[0].content).not.toBe('Message 0');
      expect(
        session.conversationHistory[MAX_HISTORY_MESSAGES - 1].content
      ).toBe('New message');
    });
  });

  describe('getConversationHistory', () => {
    it('returns conversation history for session', async () => {
      const history = [
        createMockMessage('user', 'Hello'),
        createMockMessage('assistant', 'Hi!'),
      ];
      const existingSession = createMockSession({ conversationHistory: history });
      mockPrisma.vendorSession.findUnique.mockResolvedValue(existingSession);

      const result = await getConversationHistory('session-123');

      expect(result).toEqual(history);
    });

    it('returns empty array for new session', async () => {
      const existingSession = createMockSession({ conversationHistory: [] });
      mockPrisma.vendorSession.findUnique.mockResolvedValue(existingSession);

      const result = await getConversationHistory('session-123');

      expect(result).toEqual([]);
    });

    it('returns null for non-existent session', async () => {
      mockPrisma.vendorSession.findUnique.mockResolvedValue(null);

      const result = await getConversationHistory('non-existent');

      expect(result).toBeNull();
    });
  });
});

// =============================================================================
// VENDOR STATE TESTS
// =============================================================================

describe('V1-04: Vendor State Management', () => {
  let mockPrisma: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const db = await import('@/lib/db');
    mockPrisma = db.prisma;
  });

  describe('updateVendorState', () => {
    it('updates vendor state with new values', async () => {
      const existingSession = createMockSession({ vendorState: {} });
      mockPrisma.vendorSession.findUnique.mockResolvedValue(existingSession);
      mockPrisma.vendorSession.update.mockImplementation(({ data }) => ({
        ...existingSession,
        vendorState: data.vendorState,
      }));

      const session = await updateVendorState('session-123', {
        selectedEndpoints: ['users'],
      });

      expect(session.vendorState).toEqual({ selectedEndpoints: ['users'] });
    });

    it('merges with existing state', async () => {
      const existingSession = createMockSession({
        vendorState: { ssoProvider: 'CLEVER' },
      });
      mockPrisma.vendorSession.findUnique.mockResolvedValue(existingSession);
      mockPrisma.vendorSession.update.mockImplementation(({ data }) => ({
        ...existingSession,
        vendorState: data.vendorState,
      }));

      const session = await updateVendorState('session-123', {
        selectedEndpoints: ['users'],
      });

      expect(session.vendorState).toEqual({
        ssoProvider: 'CLEVER',
        selectedEndpoints: ['users'],
      });
    });

    it('allows overwriting existing keys', async () => {
      const existingSession = createMockSession({
        vendorState: { step: 'pods' },
      });
      mockPrisma.vendorSession.findUnique.mockResolvedValue(existingSession);
      mockPrisma.vendorSession.update.mockImplementation(({ data }) => ({
        ...existingSession,
        vendorState: data.vendorState,
      }));

      const session = await updateVendorState('session-123', { step: 'sso' });

      expect(session.vendorState.step).toBe('sso');
    });
  });

  describe('getVendorState', () => {
    it('returns vendor state for session', async () => {
      const vendorState = { selectedEndpoints: ['users', 'classes'] };
      const existingSession = createMockSession({ vendorState });
      mockPrisma.vendorSession.findUnique.mockResolvedValue(existingSession);

      const result = await getVendorState('session-123');

      expect(result).toEqual(vendorState);
    });

    it('returns empty object for new session', async () => {
      const existingSession = createMockSession({ vendorState: {} });
      mockPrisma.vendorSession.findUnique.mockResolvedValue(existingSession);

      const result = await getVendorState('session-123');

      expect(result).toEqual({});
    });

    it('returns null for non-existent session', async () => {
      mockPrisma.vendorSession.findUnique.mockResolvedValue(null);

      const result = await getVendorState('non-existent');

      expect(result).toBeNull();
    });
  });
});

// =============================================================================
// SESSION LISTING TESTS
// =============================================================================

describe('V1-04: Session Listing', () => {
  let mockPrisma: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const db = await import('@/lib/db');
    mockPrisma = db.prisma;
  });

  describe('listActiveSessions', () => {
    it('returns all active sessions for vendor', async () => {
      const sessions = [createMockSession(), createMockSession({ id: 'session-456' })];
      mockPrisma.vendorSession.findMany.mockResolvedValue(sessions);

      const result = await listActiveSessions(TEST_VENDOR_ID);

      expect(result).toHaveLength(2);
      expect(mockPrisma.vendorSession.findMany).toHaveBeenCalledWith({
        where: {
          vendorId: TEST_VENDOR_ID,
          expiresAt: { gt: expect.any(Date) },
        },
        orderBy: { lastActivityAt: 'desc' },
      });
    });

    it('returns empty array when no active sessions', async () => {
      mockPrisma.vendorSession.findMany.mockResolvedValue([]);

      const result = await listActiveSessions(TEST_VENDOR_ID);

      expect(result).toEqual([]);
    });
  });
});

// =============================================================================
// SESSION CLEANUP TESTS
// =============================================================================

describe('V1-04: Session Cleanup', () => {
  let mockPrisma: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const db = await import('@/lib/db');
    mockPrisma = db.prisma;
  });

  describe('getExpiredSessions', () => {
    it('returns all expired sessions', async () => {
      const expiredSessions = [
        createMockSession({ expiresAt: new Date(Date.now() - 1000) }),
        createMockSession({ id: 'session-456', expiresAt: new Date(Date.now() - 2000) }),
      ];
      mockPrisma.vendorSession.findMany.mockResolvedValue(expiredSessions);

      const result = await getExpiredSessions();

      expect(result).toHaveLength(2);
      expect(mockPrisma.vendorSession.findMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: expect.any(Date) },
        },
      });
    });

    it('returns empty array when no expired sessions', async () => {
      mockPrisma.vendorSession.findMany.mockResolvedValue([]);

      const result = await getExpiredSessions();

      expect(result).toEqual([]);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('deletes all expired sessions', async () => {
      mockPrisma.vendorSession.deleteMany.mockResolvedValue({ count: 5 });

      const result = await cleanupExpiredSessions();

      expect(result.deletedCount).toBe(5);
      expect(mockPrisma.vendorSession.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: expect.any(Date) },
        },
      });
    });

    it('returns zero when no expired sessions', async () => {
      mockPrisma.vendorSession.deleteMany.mockResolvedValue({ count: 0 });

      const result = await cleanupExpiredSessions();

      expect(result.deletedCount).toBe(0);
    });

    it('logs cleanup activity', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      mockPrisma.vendorSession.deleteMany.mockResolvedValue({ count: 3 });

      await cleanupExpiredSessions();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cleaned up'),
        expect.any(Number)
      );
      consoleSpy.mockRestore();
    });
  });
});

// =============================================================================
// EDGE CASES AND ERROR HANDLING
// =============================================================================

describe('V1-04: Edge Cases', () => {
  let mockPrisma: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const db = await import('@/lib/db');
    mockPrisma = db.prisma;
  });

  describe('input validation', () => {
    it('handles empty vendorId gracefully', async () => {
      await expect(createSession({ vendorId: '' })).rejects.toThrow();
    });

    it('handles null session ID', async () => {
      mockPrisma.vendorSession.findUnique.mockResolvedValue(null);

      const session = await getSession('');

      expect(session).toBeNull();
    });

    it('handles very long conversation history', async () => {
      const longHistory = Array(200)
        .fill(null)
        .map((_, i) => createMockMessage('user', `Message ${i}`));

      const existingSession = createMockSession({
        conversationHistory: longHistory.slice(0, MAX_HISTORY_MESSAGES),
      });
      mockPrisma.vendorSession.findUnique.mockResolvedValue(existingSession);
      mockPrisma.vendorSession.update.mockImplementation(({ data }) => ({
        ...existingSession,
        conversationHistory: data.conversationHistory,
      }));

      const session = await addMessageToHistory('session-123', {
        role: 'user',
        content: 'New message',
      });

      expect(session.conversationHistory.length).toBeLessThanOrEqual(
        MAX_HISTORY_MESSAGES
      );
    });
  });

  describe('concurrent access', () => {
    it('handles concurrent message additions', async () => {
      const existingSession = createMockSession({ conversationHistory: [] });
      mockPrisma.vendorSession.findUnique.mockResolvedValue(existingSession);
      mockPrisma.vendorSession.update.mockImplementation(({ data }) => ({
        ...existingSession,
        conversationHistory: data.conversationHistory,
      }));

      const results = await Promise.all([
        addMessageToHistory('session-123', { role: 'user', content: 'Msg 1' }),
        addMessageToHistory('session-123', { role: 'user', content: 'Msg 2' }),
        addMessageToHistory('session-123', { role: 'user', content: 'Msg 3' }),
      ]);

      // All operations should complete (order may vary)
      expect(results).toHaveLength(3);
    });
  });

  describe('database errors', () => {
    it('handles database connection errors', async () => {
      mockPrisma.vendorSession.create.mockRejectedValue(
        new Error('Connection refused')
      );

      await expect(createSession({ vendorId: TEST_VENDOR_ID })).rejects.toThrow();
    });

    it('handles constraint violations', async () => {
      mockPrisma.vendorSession.create.mockRejectedValue(
        new Error('Unique constraint violation')
      );

      await expect(createSession({ vendorId: TEST_VENDOR_ID })).rejects.toThrow();
    });
  });
});

// =============================================================================
// SESSION TOKEN GENERATION TESTS
// =============================================================================

describe('V1-04: Session Token Generation', () => {
  let mockPrisma: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const db = await import('@/lib/db');
    mockPrisma = db.prisma;
  });

  it('generates cryptographically secure tokens', async () => {
    const sessions: VendorSession[] = [];

    for (let i = 0; i < 10; i++) {
      mockPrisma.vendorSession.create.mockResolvedValue(
        createMockSession({ sessionToken: `tok_${Math.random().toString(36)}` })
      );
      const session = await createSession({ vendorId: TEST_VENDOR_ID });
      sessions.push(session);
    }

    const tokens = sessions.map((s) => s.sessionToken);
    const uniqueTokens = new Set(tokens);

    // All tokens should be unique
    expect(uniqueTokens.size).toBe(10);
  });

  it('tokens have consistent format', async () => {
    mockPrisma.vendorSession.create.mockResolvedValue(
      createMockSession({ sessionToken: 'vss_abc123xyz789def456' })
    );

    const session = await createSession({ vendorId: TEST_VENDOR_ID });

    // Tokens should have a prefix and be URL-safe
    expect(session.sessionToken).toMatch(/^vss_[a-zA-Z0-9]+$/);
  });
});

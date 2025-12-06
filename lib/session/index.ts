/**
 * Vendor Session Module
 *
 * V1-04: Implements vendor session management for conversation persistence.
 *
 * ## Features
 *
 * - Session CRUD operations
 * - Conversation history persistence
 * - Vendor state management
 * - Session expiration and cleanup
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   createSession,
 *   getSession,
 *   addMessageToHistory,
 *   updateVendorState,
 *   cleanupExpiredSessions,
 * } from '@/lib/session';
 *
 * // Create a new session
 * const session = await createSession({ vendorId: 'vendor-123' });
 *
 * // Add message to conversation
 * await addMessageToHistory(session.id, { role: 'user', content: 'Hello' });
 *
 * // Update vendor state
 * await updateVendorState(session.id, { selectedEndpoints: ['users'] });
 *
 * // Cleanup expired sessions (run via cron)
 * await cleanupExpiredSessions();
 * ```
 *
 * @module lib/session
 */

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';

// =============================================================================
// TYPES
// =============================================================================

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolCalls?: Array<{
    name: string;
    input: Record<string, unknown>;
    output?: unknown;
  }>;
}

export interface VendorState {
  // Onboarding state
  step?: string;
  podsStatus?: string;

  // Integration preferences
  ssoProvider?: string;
  selectedEndpoints?: string[];
  ltiConfig?: Record<string, unknown>;

  // Sandbox state
  sandboxCredentials?: {
    clientId?: string;
    clientSecret?: string;
  };

  // Any additional vendor-specific data
  [key: string]: unknown;
}

export interface VendorSession {
  id: string;
  vendorId: string;
  sessionToken: string;
  conversationHistory: ConversationMessage[];
  vendorState: VendorState;
  expiresAt: Date;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSessionInput {
  vendorId: string;
  initialState?: VendorState;
}

export interface SessionStats {
  totalActive: number;
  totalExpired: number;
  oldestSession: Date | null;
}

export interface CleanupResult {
  deletedCount: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Session duration: 24 hours */
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

/** Session extension on activity: 1 hour */
export const SESSION_EXTENSION_MS = 60 * 60 * 1000;

/** Maximum messages to store in conversation history */
export const MAX_HISTORY_MESSAGES = 100;

/** Session token prefix */
const SESSION_TOKEN_PREFIX = 'vss_';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Generate a cryptographically secure session token
 */
function generateSessionToken(): string {
  const randomPart = randomBytes(24).toString('base64url');
  return `${SESSION_TOKEN_PREFIX}${randomPart}`;
}

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  const timestamp = Date.now();
  const random = randomBytes(6).toString('base64url');
  return `msg-${timestamp}-${random}`;
}

/**
 * Parse JSON safely with type checking
 */
function parseJsonField<T>(value: unknown, defaultValue: T): T {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }
  return value as T;
}

/**
 * Convert Prisma result to VendorSession type
 */
function toVendorSession(dbSession: {
  id: string;
  vendorId: string;
  sessionToken: string;
  conversationHistory: unknown;
  vendorState: unknown;
  expiresAt: Date;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}): VendorSession {
  return {
    id: dbSession.id,
    vendorId: dbSession.vendorId,
    sessionToken: dbSession.sessionToken,
    conversationHistory: parseJsonField<ConversationMessage[]>(
      dbSession.conversationHistory,
      []
    ),
    vendorState: parseJsonField<VendorState>(dbSession.vendorState, {}),
    expiresAt: dbSession.expiresAt,
    lastActivityAt: dbSession.lastActivityAt,
    createdAt: dbSession.createdAt,
    updatedAt: dbSession.updatedAt,
  };
}

// =============================================================================
// SESSION CREATION
// =============================================================================

/**
 * Create a new vendor session
 *
 * @param input - Session creation input
 * @returns Created session
 * @throws Error if vendorId is empty
 */
export async function createSession(
  input: CreateSessionInput
): Promise<VendorSession> {
  if (!input.vendorId || input.vendorId.trim() === '') {
    throw new Error('vendorId is required');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  const dbSession = await prisma.vendorSession.create({
    data: {
      vendorId: input.vendorId,
      sessionToken: generateSessionToken(),
      conversationHistory: [],
      vendorState: (input.initialState || {}) as Prisma.InputJsonValue,
      expiresAt,
      lastActivityAt: now,
    },
  });

  return toVendorSession(dbSession);
}

// =============================================================================
// SESSION RETRIEVAL
// =============================================================================

/**
 * Get session by ID
 *
 * @param sessionId - Session ID
 * @returns Session or null if not found/expired
 */
export async function getSession(sessionId: string): Promise<VendorSession | null> {
  if (!sessionId) {
    return null;
  }

  const dbSession = await prisma.vendorSession.findUnique({
    where: { id: sessionId },
  });

  if (!dbSession) {
    return null;
  }

  // Check if expired
  if (dbSession.expiresAt < new Date()) {
    return null;
  }

  return toVendorSession(dbSession);
}

/**
 * Get session by token
 *
 * @param token - Session token
 * @returns Session or null if not found/expired
 */
export async function getSessionByToken(
  token: string
): Promise<VendorSession | null> {
  if (!token) {
    return null;
  }

  const dbSession = await prisma.vendorSession.findFirst({
    where: {
      sessionToken: token,
      expiresAt: { gt: new Date() },
    },
  });

  if (!dbSession) {
    return null;
  }

  return toVendorSession(dbSession);
}

// =============================================================================
// SESSION UPDATE
// =============================================================================

/**
 * Update session data
 *
 * @param sessionId - Session ID
 * @param data - Data to update
 * @returns Updated session
 */
export async function updateSession(
  sessionId: string,
  data: Partial<{
    conversationHistory: ConversationMessage[];
    vendorState: VendorState;
  }>
): Promise<VendorSession> {
  const updateData: Record<string, unknown> = {
    lastActivityAt: new Date(),
  };

  if (data.conversationHistory !== undefined) {
    updateData.conversationHistory = data.conversationHistory;
  }
  if (data.vendorState !== undefined) {
    updateData.vendorState = data.vendorState;
  }

  const dbSession = await prisma.vendorSession.update({
    where: { id: sessionId },
    data: updateData,
  });

  return toVendorSession(dbSession);
}

/**
 * Extend session expiration
 *
 * @param sessionId - Session ID
 * @returns Updated session or null if not found
 */
export async function extendSession(
  sessionId: string
): Promise<VendorSession | null> {
  const existingSession = await prisma.vendorSession.findUnique({
    where: { id: sessionId },
  });

  if (!existingSession || existingSession.expiresAt < new Date()) {
    return null;
  }

  const newExpiresAt = new Date(
    existingSession.expiresAt.getTime() + SESSION_EXTENSION_MS
  );

  const dbSession = await prisma.vendorSession.update({
    where: { id: sessionId },
    data: {
      expiresAt: newExpiresAt,
      lastActivityAt: new Date(),
    },
  });

  return toVendorSession(dbSession);
}

// =============================================================================
// SESSION DELETION
// =============================================================================

/**
 * Delete a session
 *
 * @param sessionId - Session ID
 * @returns true if deleted, false otherwise
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    await prisma.vendorSession.delete({
      where: { id: sessionId },
    });
    return true;
  } catch (error) {
    // Record not found - that's okay
    console.warn('[Session] Delete failed - session may not exist:', sessionId);
    return false;
  }
}

// =============================================================================
// CONVERSATION HISTORY
// =============================================================================

/**
 * Add a message to conversation history
 *
 * @param sessionId - Session ID
 * @param message - Message to add (without id/timestamp)
 * @returns Updated session
 */
export async function addMessageToHistory(
  sessionId: string,
  message: { role: 'user' | 'assistant' | 'system'; content: string }
): Promise<VendorSession> {
  const session = await prisma.vendorSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const currentHistory = parseJsonField<ConversationMessage[]>(
    session.conversationHistory,
    []
  );

  // Create new message with ID and timestamp
  const newMessage: ConversationMessage = {
    id: generateMessageId(),
    role: message.role,
    content: message.content,
    timestamp: new Date().toISOString(),
  };

  // Add to history
  let updatedHistory = [...currentHistory, newMessage];

  // Trim if exceeds max
  if (updatedHistory.length > MAX_HISTORY_MESSAGES) {
    updatedHistory = updatedHistory.slice(-MAX_HISTORY_MESSAGES);
  }

  return updateSession(sessionId, { conversationHistory: updatedHistory });
}

/**
 * Get conversation history for a session
 *
 * @param sessionId - Session ID
 * @returns Conversation history or null if session not found
 */
export async function getConversationHistory(
  sessionId: string
): Promise<ConversationMessage[] | null> {
  const session = await prisma.vendorSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return null;
  }

  return parseJsonField<ConversationMessage[]>(session.conversationHistory, []);
}

// =============================================================================
// VENDOR STATE
// =============================================================================

/**
 * Update vendor state (merges with existing)
 *
 * @param sessionId - Session ID
 * @param state - State to merge
 * @returns Updated session
 */
export async function updateVendorState(
  sessionId: string,
  state: Partial<VendorState>
): Promise<VendorSession> {
  const session = await prisma.vendorSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const currentState = parseJsonField<VendorState>(session.vendorState, {});
  const mergedState = { ...currentState, ...state };

  return updateSession(sessionId, { vendorState: mergedState });
}

/**
 * Get vendor state for a session
 *
 * @param sessionId - Session ID
 * @returns Vendor state or null if session not found
 */
export async function getVendorState(
  sessionId: string
): Promise<VendorState | null> {
  const session = await prisma.vendorSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return null;
  }

  return parseJsonField<VendorState>(session.vendorState, {});
}

// =============================================================================
// SESSION LISTING
// =============================================================================

/**
 * List all active sessions for a vendor
 *
 * @param vendorId - Vendor ID
 * @returns Array of active sessions
 */
export async function listActiveSessions(
  vendorId: string
): Promise<VendorSession[]> {
  const dbSessions = await prisma.vendorSession.findMany({
    where: {
      vendorId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastActivityAt: 'desc' },
  });

  return dbSessions.map(toVendorSession);
}

// =============================================================================
// SESSION CLEANUP
// =============================================================================

/**
 * Get all expired sessions
 *
 * @returns Array of expired sessions
 */
export async function getExpiredSessions(): Promise<VendorSession[]> {
  const dbSessions = await prisma.vendorSession.findMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  return dbSessions.map(toVendorSession);
}

/**
 * Clean up all expired sessions
 *
 * @returns Cleanup result with deleted count
 */
export async function cleanupExpiredSessions(): Promise<CleanupResult> {
  const result = await prisma.vendorSession.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  console.log('[Session] Cleaned up expired sessions:', result.count);

  return { deletedCount: result.count };
}

/**
 * Get session statistics
 *
 * @returns Session statistics
 */
export async function getSessionStats(): Promise<SessionStats> {
  const now = new Date();

  const [totalActive, totalExpired, oldestSession] = await Promise.all([
    prisma.vendorSession.count({
      where: { expiresAt: { gt: now } },
    }),
    prisma.vendorSession.count({
      where: { expiresAt: { lt: now } },
    }),
    prisma.vendorSession.findFirst({
      where: { expiresAt: { gt: now } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
  ]);

  return {
    totalActive,
    totalExpired,
    oldestSession: oldestSession?.createdAt || null,
  };
}

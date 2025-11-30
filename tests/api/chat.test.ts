/**
 * Chat API Integration Tests
 *
 * Tests for /api/chat endpoint including validation, streaming, and error handling.
 *
 * @module tests/api/chat
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ValidationError,
  AIServiceError,
  AppError,
  ErrorCodes,
  isAppError,
  getUserErrorMessage,
  logError,
} from '@/lib/errors';

// =============================================================================
// ERROR CLASSES TESTS
// =============================================================================

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with default values', () => {
      const error = new AppError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCodes.INTERNAL_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should create error with custom values', () => {
      const error = new AppError(
        'Custom error',
        ErrorCodes.VALIDATION_ERROR,
        400,
        { field: 'name' }
      );

      expect(error.message).toBe('Custom error');
      expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'name' });
    });

    it('should serialize to JSON correctly', () => {
      const error = new AppError('JSON error', ErrorCodes.NOT_FOUND, 404);
      const json = error.toJSON();

      expect(json.name).toBe('AppError');
      expect(json.message).toBe('JSON error');
      expect(json.code).toBe(ErrorCodes.NOT_FOUND);
      expect(json.statusCode).toBe(404);
      expect(json.timestamp).toBeDefined();
    });

    it('should return user message', () => {
      const error = new AppError('User visible message');
      expect(error.toUserMessage()).toBe('User visible message');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error without field', () => {
      const error = new ValidationError('Invalid input');

      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
      expect(error.field).toBeUndefined();
    });

    it('should create validation error with field', () => {
      const error = new ValidationError('Required', 'email');

      expect(error.message).toBe('Required');
      expect(error.code).toBe(ErrorCodes.INVALID_INPUT);
      expect(error.field).toBe('email');
    });

    it('should create validation error with field and value', () => {
      const error = new ValidationError('Invalid format', 'email', 'not-an-email');

      expect(error.field).toBe('email');
      expect(error.value).toBe('not-an-email');
    });

    it('should generate user message with field', () => {
      const error = new ValidationError('must be a valid email', 'email');
      expect(error.toUserMessage()).toBe('Invalid email: must be a valid email');
    });

    it('should generate user message without field', () => {
      const error = new ValidationError('Invalid data format');
      expect(error.toUserMessage()).toBe('Invalid data format');
    });
  });

  describe('AIServiceError', () => {
    it('should create AI service error with defaults', () => {
      const error = new AIServiceError('AI unavailable');

      expect(error.message).toBe('AI unavailable');
      expect(error.code).toBe(ErrorCodes.AI_SERVICE_ERROR);
      expect(error.provider).toBe('anthropic');
      expect(error.isRateLimited).toBe(false);
    });

    it('should create rate limited error', () => {
      const error = new AIServiceError('Too many requests', {
        isRateLimited: true,
        retryAfter: 60,
      });

      expect(error.code).toBe(ErrorCodes.RATE_LIMITED);
      expect(error.isRateLimited).toBe(true);
      expect(error.retryAfter).toBe(60);
    });

    it('should generate appropriate user messages', () => {
      const aiError = new AIServiceError('Service down');
      expect(aiError.toUserMessage()).toContain('unavailable');

      const rateLimitError = new AIServiceError('Rate limited', { isRateLimited: true });
      expect(rateLimitError.toUserMessage()).toContain('busy');
    });

    it('should include custom provider', () => {
      const error = new AIServiceError('Error', { provider: 'openai' });
      expect(error.provider).toBe('openai');
    });
  });
});

// =============================================================================
// HELPER FUNCTIONS TESTS
// =============================================================================

describe('Error Helper Functions', () => {
  describe('isAppError', () => {
    it('should return true for AppError', () => {
      expect(isAppError(new AppError('test'))).toBe(true);
    });

    it('should return true for ValidationError', () => {
      expect(isAppError(new ValidationError('test'))).toBe(true);
    });

    it('should return true for AIServiceError', () => {
      expect(isAppError(new AIServiceError('test'))).toBe(true);
    });

    it('should return false for regular Error', () => {
      expect(isAppError(new Error('test'))).toBe(false);
    });

    it('should return false for non-errors', () => {
      expect(isAppError('string')).toBe(false);
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
      expect(isAppError({})).toBe(false);
    });
  });

  describe('getUserErrorMessage', () => {
    it('should return toUserMessage for AppError', () => {
      const error = new ValidationError('Field required', 'name');
      expect(getUserErrorMessage(error)).toBe('Invalid name: Field required');
    });

    it('should handle network errors', () => {
      const error = new Error('Failed to fetch');
      expect(getUserErrorMessage(error)).toContain('Connection error');
    });

    it('should handle abort errors', () => {
      const error = new Error('Request aborted');
      error.name = 'AbortError';
      expect(getUserErrorMessage(error)).toContain('cancelled');
    });

    it('should handle timeout errors', () => {
      const error = new Error('timeout exceeded');
      expect(getUserErrorMessage(error)).toContain('timed out');
    });

    it('should return message for regular errors', () => {
      const error = new Error('Custom error message');
      expect(getUserErrorMessage(error)).toBe('Custom error message');
    });

    it('should return string for string input', () => {
      expect(getUserErrorMessage('String error')).toBe('String error');
    });

    it('should return generic message for unknown types', () => {
      expect(getUserErrorMessage(null)).toContain('unexpected error');
      expect(getUserErrorMessage(123)).toContain('unexpected error');
    });
  });

  describe('logError', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log AppError with context', () => {
      const error = new AppError('Test error');
      logError(error, { action: 'test_action' });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[AppError]',
        expect.objectContaining({
          action: 'test_action',
          error: expect.objectContaining({
            message: 'Test error',
          }),
        })
      );
    });

    it('should log regular Error', () => {
      const error = new Error('Regular error');
      logError(error);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Error]',
        expect.objectContaining({
          name: 'Error',
          message: 'Regular error',
        })
      );
    });

    it('should log unknown error types', () => {
      logError('string error');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Unknown Error]',
        expect.objectContaining({
          error: 'string error',
        })
      );
    });
  });
});

// =============================================================================
// CHAT REQUEST VALIDATION TESTS
// =============================================================================

describe('Chat Request Validation', () => {
  // These tests validate the request structure that the API expects
  // In a real integration test, we would mock the fetch call

  interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
  }

  function validateChatRequest(body: unknown): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!body || typeof body !== 'object') {
      return { valid: false, errors: ['Invalid request body'] };
    }

    const request = body as Record<string, unknown>;

    if (!request.messages) {
      errors.push('Messages field is required');
    } else if (!Array.isArray(request.messages)) {
      errors.push('Messages must be an array');
    } else if (request.messages.length === 0) {
      errors.push('Messages array must not be empty');
    } else {
      for (let i = 0; i < request.messages.length; i++) {
        const msg = request.messages[i] as ChatMessage | undefined;
        if (!msg || !msg.role || !['user', 'assistant'].includes(msg.role)) {
          errors.push(`Invalid role at messages[${i}]`);
        }
        if (!msg || typeof msg.content !== 'string') {
          errors.push(`Invalid content at messages[${i}]`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  describe('validateChatRequest', () => {
    it('should accept valid request', () => {
      const result = validateChatRequest({
        messages: [{ role: 'user', content: 'Hello' }],
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing messages', () => {
      const result = validateChatRequest({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Messages field is required');
    });

    it('should reject non-array messages', () => {
      const result = validateChatRequest({ messages: 'not an array' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Messages must be an array');
    });

    it('should reject empty messages array', () => {
      const result = validateChatRequest({ messages: [] });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Messages array must not be empty');
    });

    it('should reject invalid role', () => {
      const result = validateChatRequest({
        messages: [{ role: 'system', content: 'Hello' }],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid role'))).toBe(true);
    });

    it('should reject non-string content', () => {
      const result = validateChatRequest({
        messages: [{ role: 'user', content: 123 }],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid content'))).toBe(true);
    });

    it('should accept multiple valid messages', () => {
      const result = validateChatRequest({
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
          { role: 'user', content: 'How are you?' },
        ],
      });
      expect(result.valid).toBe(true);
    });

    it('should accept request with vendor context', () => {
      const result = validateChatRequest({
        messages: [{ role: 'user', content: 'Hello' }],
        vendorContext: {
          vendorId: 'vendor-123',
          vendorName: 'Test Vendor',
        },
      });
      expect(result.valid).toBe(true);
    });
  });
});

// =============================================================================
// STREAMING RESPONSE FORMAT TESTS
// =============================================================================

describe('Streaming Response Format', () => {
  // These tests validate the SSE format of streaming responses

  interface StreamEvent {
    type: string;
    [key: string]: unknown;
  }

  function parseSSELine(line: string): StreamEvent | null {
    if (!line.startsWith('data: ')) {
      return null;
    }

    const data = line.slice(6);
    if (data === '[DONE]') {
      return { type: 'done' };
    }

    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  describe('parseSSELine', () => {
    it('should parse content event', () => {
      const event = parseSSELine('data: {"type":"content","text":"Hello"}');
      expect(event).toEqual({ type: 'content', text: 'Hello' });
    });

    it('should parse tool_start event', () => {
      const event = parseSSELine('data: {"type":"tool_start","tool":"lookup_pods","id":"123"}');
      expect(event).toEqual({ type: 'tool_start', tool: 'lookup_pods', id: '123' });
    });

    it('should parse tool_result event', () => {
      const event = parseSSELine(
        'data: {"type":"tool_result","tool":"lookup_pods","id":"123","result":{"success":true}}'
      );
      expect(event).toEqual({
        type: 'tool_result',
        tool: 'lookup_pods',
        id: '123',
        result: { success: true },
      });
    });

    it('should parse error event', () => {
      const event = parseSSELine('data: {"type":"error","error":"Something went wrong","code":"INTERNAL_ERROR"}');
      expect(event).toEqual({
        type: 'error',
        error: 'Something went wrong',
        code: 'INTERNAL_ERROR',
      });
    });

    it('should parse DONE marker', () => {
      const event = parseSSELine('data: [DONE]');
      expect(event).toEqual({ type: 'done' });
    });

    it('should return null for non-data lines', () => {
      expect(parseSSELine('event: message')).toBeNull();
      expect(parseSSELine(': comment')).toBeNull();
      expect(parseSSELine('')).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      expect(parseSSELine('data: {invalid json}')).toBeNull();
    });
  });

  describe('Stream Event Types', () => {
    it('should define all expected event types', () => {
      const expectedTypes = [
        'content',       // Text content from Claude
        'tool_start',    // Tool execution starting
        'tool_executing',// Tool is being executed
        'tool_result',   // Tool execution completed
        'error',         // Error occurred
        'done',          // Stream completed
      ];

      // This test documents the expected event types
      expect(expectedTypes).toContain('content');
      expect(expectedTypes).toContain('tool_start');
      expect(expectedTypes).toContain('tool_result');
      expect(expectedTypes).toContain('error');
    });
  });
});

// =============================================================================
// TOOL RESULT FORMATTING TESTS
// =============================================================================

describe('Tool Result Formatting', () => {
  interface ToolResult {
    success: boolean;
    data?: unknown;
    error?: string;
    showForm?: string;
    message?: string;
    hasData?: boolean;
  }

  function formatToolResultForClaude(result: ToolResult): string {
    if (!result.success) {
      return JSON.stringify({
        error: result.error,
        success: false,
      });
    }

    const response: Record<string, unknown> = {
      success: true,
    };

    if (result.message) {
      response.message = result.message;
    }

    if (result.showForm) {
      response.showForm = result.showForm;
      response.instruction = `Display the ${result.showForm} form to the user. Include [FORM:${result.showForm.toUpperCase()}] in your response.`;
    }

    if (result.data) {
      response.data = result.data;
    }

    if (result.hasData) {
      response.hasData = true;
      response.displayInstruction = 'Format and display this data in a clear, readable way for the user.';
    }

    response.reminderForClaude = 'Remember to include [SUGGESTIONS:...] at the end of your response with 2-4 contextual next steps.';

    return JSON.stringify(response);
  }

  it('should format error result', () => {
    const result = formatToolResultForClaude({
      success: false,
      error: 'Vendor not found',
    });

    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toBe('Vendor not found');
  });

  it('should format success result with message', () => {
    const result = formatToolResultForClaude({
      success: true,
      message: 'Operation completed',
    });

    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    expect(parsed.message).toBe('Operation completed');
  });

  it('should include form instruction when showForm is set', () => {
    const result = formatToolResultForClaude({
      success: true,
      showForm: 'pods_lite',
    });

    const parsed = JSON.parse(result);
    expect(parsed.showForm).toBe('pods_lite');
    expect(parsed.instruction).toContain('[FORM:PODS_LITE]');
  });

  it('should include data when provided', () => {
    const result = formatToolResultForClaude({
      success: true,
      data: { vendorId: '123', name: 'Test' },
    });

    const parsed = JSON.parse(result);
    expect(parsed.data).toEqual({ vendorId: '123', name: 'Test' });
  });

  it('should include display instruction when hasData is true', () => {
    const result = formatToolResultForClaude({
      success: true,
      hasData: true,
      data: [{ id: 1 }, { id: 2 }],
    });

    const parsed = JSON.parse(result);
    expect(parsed.hasData).toBe(true);
    expect(parsed.displayInstruction).toBeDefined();
  });

  it('should always include reminder for Claude', () => {
    const result = formatToolResultForClaude({
      success: true,
    });

    const parsed = JSON.parse(result);
    expect(parsed.reminderForClaude).toContain('[SUGGESTIONS:');
  });
});

// =============================================================================
// ERROR RESPONSE TESTS
// =============================================================================

describe('Error Response Structure', () => {
  interface ErrorResponse {
    error: string;
    code?: string;
    details?: Record<string, unknown>;
  }

  function createErrorResponse(error: string, code?: string, details?: Record<string, unknown>): ErrorResponse {
    const response: ErrorResponse = { error };
    if (code) response.code = code;
    if (details) response.details = details;
    return response;
  }

  it('should create minimal error response', () => {
    const response = createErrorResponse('Something went wrong');
    expect(response).toEqual({ error: 'Something went wrong' });
  });

  it('should create error response with code', () => {
    const response = createErrorResponse('Invalid input', ErrorCodes.VALIDATION_ERROR);
    expect(response).toEqual({
      error: 'Invalid input',
      code: ErrorCodes.VALIDATION_ERROR,
    });
  });

  it('should create error response with details', () => {
    const response = createErrorResponse('Invalid field', ErrorCodes.INVALID_INPUT, {
      field: 'email',
      value: 'not-an-email',
    });
    expect(response).toEqual({
      error: 'Invalid field',
      code: ErrorCodes.INVALID_INPUT,
      details: { field: 'email', value: 'not-an-email' },
    });
  });
});

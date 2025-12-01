/**
 * AI Tool Definitions Unit Tests
 *
 * Tests for tool definitions, validation, and helper functions.
 *
 * @module tests/ai-tools/tools
 */

import { describe, it, expect } from 'vitest';
import {
  TOOL_DEFINITIONS,
  getToolByName,
  getToolNames,
  validateToolInput,
  type ToolName,
} from '@/lib/ai/tools';

// =============================================================================
// TOOL DEFINITIONS TESTS
// =============================================================================

describe('TOOL_DEFINITIONS', () => {
  it('should have exactly 13 tools defined', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(13);
  });

  it('should have all expected tool names', () => {
    const expectedTools: ToolName[] = [
      'lookup_pods',
      'submit_pods_lite',
      'provision_sandbox',
      'configure_sso',
      'test_oneroster',
      'configure_lti',
      'send_test_message',
      'submit_app',
      'get_audit_logs',
      'get_credentials',
      'check_status',
      'request_upgrade',
      'update_endpoints',
    ];

    const actualNames = TOOL_DEFINITIONS.map((t) => t.name);
    for (const expected of expectedTools) {
      expect(actualNames).toContain(expected);
    }
  });

  it('should have valid Anthropic tool schema for each tool', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.name).toBeDefined();
      expect(typeof tool.name).toBe('string');
      expect(tool.description).toBeDefined();
      expect(typeof tool.description).toBe('string');
      expect(tool.input_schema).toBeDefined();
      expect(tool.input_schema.type).toBe('object');
    }
  });

  it('should have required fields defined in schema for each tool', () => {
    for (const tool of TOOL_DEFINITIONS) {
      const schema = tool.input_schema;
      expect(schema.properties).toBeDefined();
      // Required should be an array if defined
      if (schema.required) {
        expect(Array.isArray(schema.required)).toBe(true);
        // Each required field should exist in properties
        for (const field of schema.required) {
          expect(Object.keys(schema.properties as object)).toContain(field);
        }
      }
    }
  });

  it('should have meaningful descriptions for each tool', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.description).toBeDefined();
      expect(tool.description!.length).toBeGreaterThan(50);
      // Description should mention when to use the tool
      expect(
        tool.description!.toLowerCase().includes('use this tool') ||
          tool.description!.toLowerCase().includes('when')
      ).toBe(true);
    }
  });
});

// =============================================================================
// SPECIFIC TOOL SCHEMA TESTS
// =============================================================================

describe('lookup_pods tool schema', () => {
  const tool = TOOL_DEFINITIONS.find((t) => t.name === 'lookup_pods');

  it('should require query parameter', () => {
    expect(tool?.input_schema.required).toContain('query');
  });

  it('should have query as string type', () => {
    const props = tool?.input_schema.properties as Record<string, { type?: string }>;
    expect(props.query?.type).toBe('string');
  });
});

describe('submit_pods_lite tool schema', () => {
  const tool = TOOL_DEFINITIONS.find((t) => t.name === 'submit_pods_lite');

  it('should require trigger_form parameter', () => {
    expect(tool?.input_schema.required).toContain('trigger_form');
  });

  it('should have optional prefill fields', () => {
    const props = tool?.input_schema.properties as Record<string, unknown>;
    expect(props.prefill_vendor_name).toBeDefined();
    expect(props.prefill_email).toBeDefined();
  });
});

describe('configure_sso tool schema', () => {
  const tool = TOOL_DEFINITIONS.find((t) => t.name === 'configure_sso');

  it('should require provider parameter', () => {
    expect(tool?.input_schema.required).toContain('provider');
  });

  it('should have provider enum with valid options', () => {
    const props = tool?.input_schema.properties as Record<string, { enum?: string[] }>;
    expect(props.provider?.enum).toContain('CLEVER');
    expect(props.provider?.enum).toContain('CLASSLINK');
    expect(props.provider?.enum).toContain('GOOGLE');
  });
});

describe('test_oneroster tool schema', () => {
  const tool = TOOL_DEFINITIONS.find((t) => t.name === 'test_oneroster');

  it('should require endpoint parameter', () => {
    expect(tool?.input_schema.required).toContain('endpoint');
  });

  it('should have endpoint enum with valid options', () => {
    const props = tool?.input_schema.properties as Record<string, { enum?: string[] }>;
    expect(props.endpoint?.enum).toEqual(['/users', '/orgs', '/classes', '/enrollments', '/courses']);
  });

  it('should have optional filters object', () => {
    const props = tool?.input_schema.properties as Record<string, { type?: string }>;
    expect(props.filters?.type).toBe('object');
  });
});

describe('send_test_message tool schema', () => {
  const tool = TOOL_DEFINITIONS.find((t) => t.name === 'send_test_message');

  it('should require channel, recipient_token, and body', () => {
    expect(tool?.input_schema.required).toContain('channel');
    expect(tool?.input_schema.required).toContain('recipient_token');
    expect(tool?.input_schema.required).toContain('body');
  });

  it('should have channel enum with EMAIL and SMS', () => {
    const props = tool?.input_schema.properties as Record<string, { enum?: string[] }>;
    expect(props.channel?.enum).toEqual(['EMAIL', 'SMS']);
  });
});

describe('request_upgrade tool schema', () => {
  const tool = TOOL_DEFINITIONS.find((t) => t.name === 'request_upgrade');

  it('should require vendor_id, target_tier, and justification', () => {
    expect(tool?.input_schema.required).toContain('vendor_id');
    expect(tool?.input_schema.required).toContain('target_tier');
    expect(tool?.input_schema.required).toContain('justification');
  });

  it('should have target_tier enum with valid options', () => {
    const props = tool?.input_schema.properties as Record<string, { enum?: string[] }>;
    expect(props.target_tier?.enum).toEqual(['SELECTIVE', 'FULL_ACCESS']);
  });

  it('should have data_elements_needed as array', () => {
    const props = tool?.input_schema.properties as Record<string, { type?: string }>;
    expect(props.data_elements_needed?.type).toBe('array');
  });
});

// =============================================================================
// HELPER FUNCTION TESTS
// =============================================================================

describe('getToolByName', () => {
  it('should return tool definition for valid name', () => {
    const tool = getToolByName('lookup_pods');
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('lookup_pods');
  });

  it('should return undefined for invalid name', () => {
    const tool = getToolByName('invalid_tool');
    expect(tool).toBeUndefined();
  });

  it('should return correct tool for each valid name', () => {
    const names = getToolNames();
    for (const name of names) {
      const tool = getToolByName(name);
      expect(tool).toBeDefined();
      expect(tool?.name).toBe(name);
    }
  });
});

describe('getToolNames', () => {
  it('should return array of all tool names', () => {
    const names = getToolNames();
    expect(Array.isArray(names)).toBe(true);
    expect(names).toHaveLength(13);
  });

  it('should return unique names', () => {
    const names = getToolNames();
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });
});

describe('validateToolInput', () => {
  describe('basic validation', () => {
    it('should return invalid for unknown tool', () => {
      const result = validateToolInput('unknown_tool', {});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unknown tool: unknown_tool');
    });

    it('should return valid for tool with all required fields', () => {
      const result = validateToolInput('lookup_pods', { query: 'test query' });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('required field validation', () => {
    it('should fail when required field is missing', () => {
      const result = validateToolInput('lookup_pods', {});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: query');
    });

    it('should fail when required field is undefined', () => {
      const result = validateToolInput('lookup_pods', { query: undefined });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: query');
    });

    it('should pass when all required fields present', () => {
      const result = validateToolInput('send_test_message', {
        channel: 'EMAIL',
        recipient_token: 'token',
        body: 'message',
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('enum validation', () => {
    it('should fail for invalid enum value', () => {
      const result = validateToolInput('configure_sso', {
        provider: 'INVALID_PROVIDER',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid value'))).toBe(true);
    });

    it('should pass for valid enum value', () => {
      const result = validateToolInput('configure_sso', {
        provider: 'CLEVER',
      });
      expect(result.valid).toBe(true);
    });

    it('should validate test_oneroster endpoint enum', () => {
      const validResult = validateToolInput('test_oneroster', {
        endpoint: '/users',
      });
      expect(validResult.valid).toBe(true);

      const invalidResult = validateToolInput('test_oneroster', {
        endpoint: '/invalid',
      });
      expect(invalidResult.valid).toBe(false);
    });

    it('should validate send_test_message channel enum', () => {
      const validResult = validateToolInput('send_test_message', {
        channel: 'SMS',
        recipient_token: 'token',
        body: 'msg',
      });
      expect(validResult.valid).toBe(true);

      const invalidResult = validateToolInput('send_test_message', {
        channel: 'FAX',
        recipient_token: 'token',
        body: 'msg',
      });
      expect(invalidResult.valid).toBe(false);
    });
  });

  describe('multiple error collection', () => {
    it('should collect multiple errors', () => {
      const result = validateToolInput('request_upgrade', {
        // Missing: vendor_id, target_tier, justification
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});

// =============================================================================
// TYPE EXPORT TESTS
// =============================================================================

describe('Type exports', () => {
  it('should export ToolName type with all tools', () => {
    const toolNames: ToolName[] = [
      'lookup_pods',
      'submit_pods_lite',
      'provision_sandbox',
      'configure_sso',
      'test_oneroster',
      'configure_lti',
      'send_test_message',
      'submit_app',
      'get_audit_logs',
      'get_credentials',
      'check_status',
      'request_upgrade',
      'update_endpoints',
    ];
    // If this compiles, the types are correct
    expect(toolNames).toHaveLength(13);
  });
});

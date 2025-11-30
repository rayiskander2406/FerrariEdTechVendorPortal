# Exponential Accelerators & Quality Multipliers

> Patterns that provide multiplicative returns on investment

## Schema-First Architecture (Primary Accelerator)

**Principle**: Single Zod schema generates everything - forms, validation, AI tools, mocks, docs.

```
                    ┌─────────────────┐
                    │   Zod Schema    │
                    │  (Single Truth) │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Form Config  │   │   AI Tool     │   │  Mock Data    │
│  (UI fields)  │   │  (JSON schema)│   │  (fixtures)   │
└───────────────┘   └───────────────┘   └───────────────┘
```

**Impact**: Change schema once → all consumers update automatically.

**Files**:
- `lib/schemas/core.ts` - Schema definition with metadata
- `lib/schemas/generators/form-fields.ts` - UI generation
- `lib/schemas/generators/ai-tool.ts` - Tool schema generation
- `lib/schemas/generators/mock-factory.ts` - Test data generation

## Centralized Config Pattern (CONFIG-03)

**Principle**: All related constants, types, and helpers in single files.

| Config File | Contains |
|-------------|----------|
| `lib/config/ai-tools.ts` | Tool IDs, names, descriptions |
| `lib/config/forms.ts` | Form types, triggers, metadata |
| `lib/config/sso.ts` | Provider info, domains, helpers |
| `lib/config/oneroster.ts` | Endpoints, metadata, validation |
| `lib/config/cpaas.ts` | Channels, pricing, delivery status |

**Impact**: No scattered magic strings. IDE autocomplete works everywhere.

## Architecture Consistency Tests

**Principle**: Tests that verify structural rules catch drift before it spreads.

```typescript
// Verify centralized config is used
expect(content).toMatch(/from ["']@\/lib\/config\/ai-tools["']/);

// Verify all tools have handlers
for (const tool of AI_TOOLS) {
  expect(handlers[tool.id]).toBeDefined();
}
```

**Impact**: Architectural decisions are enforced automatically, not by code review.

## Build-Time Verification

**Principle**: Production build catches errors dev mode misses.

```bash
# Pre-commit hook or CI step
npm run build && npm test
```

**Impact**: Type errors caught before deployment, not in production.

## Shadow Mode for Migration

**Principle**: Compare generated configs to hand-coded ones during migration.

```typescript
const comparison = compareSectionConfigs(existing, generated);
if (!comparison.match) {
  console.warn("Drift detected:", comparison.mismatches);
}
```

**Impact**: Safe incremental migration without breaking existing functionality.

## Deterministic Test Data

**Principle**: Seeded random generators produce reproducible data.

```typescript
class SeededRandom {
  constructor(seed: number = 12345) { this.seed = seed; }
  next(): number { /* deterministic */ }
}
```

**Impact**: Tests are reproducible. Demos show consistent data.

## Coverage as Safety Net

**Current**: 81% coverage, 1692 tests

**Impact**: High coverage enables rapid iteration with confidence.

---

## Implementation Priority

1. **Complete schema-first migration** - Remaining forms (SSO, LTI, CommTest)
2. **Add build verification to CI** - Catch strict mode errors automatically
3. **Expand consistency tests** - Cover more architectural patterns
4. **Document all centralized configs** - Make patterns discoverable

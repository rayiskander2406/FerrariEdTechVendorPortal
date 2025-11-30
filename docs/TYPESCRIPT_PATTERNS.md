# TypeScript Strict Mode Patterns

> Learnings from demo readiness verification (Nov 2024)

## Array Indexing with `noUncheckedIndexedAccess`

With strict mode, `array[index]` returns `T | undefined`, not `T`.

```typescript
// Problem: Type 'T | undefined' is not assignable to type 'T'
const item = array[index];

// Solution 1: Non-null assertion (when index is guaranteed valid)
const item = array[index]!;

// Solution 2: Nullish coalescing with fallback
const item = array[index] ?? defaultValue;

// Solution 3: Optional chaining for property access
const length = array[index]?.length ?? 0;
```

## Zod Internal Type Access

Accessing Zod's internal `_def` properties requires double type assertion:

```typescript
// Won't compile - types don't overlap
const def = schema._def as { typeName: string };

// Works - cast to unknown first
const def = schema._def as unknown as { typeName: string; defaultValue?: () => unknown };

// Common patterns needed:
// - typeName: "ZodString" | "ZodNumber" | "ZodDefault" | etc.
// - element: ZodTypeAny (for ZodArray)
// - valueType: ZodTypeAny (for ZodRecord)
// - checks: Array<{ kind: string; value?: number }> (for validators)
```

## ES Iteration Compatibility

Spread on `Set` and `Map` requires ES2015+ target or `downlevelIteration` flag.

```typescript
// Problem: Can only be iterated with --downlevelIteration
const unique = [...new Set(array)];
for (const [key, value] of map) { }

// Solution: Use Array.from()
const unique = Array.from(new Set(array));
for (const [key, value] of Array.from(map)) { }
```

## Build vs Dev Mode Type Checking

Production builds (`npm run build`) catch strict mode errors that dev mode misses.

**Best Practice**: Run `npm run build` before committing significant changes.

```bash
# Quick verification before commit
npm run build && npm test
```

## Interface Completeness

TypeScript interfaces must include ALL possible properties returned by functions.

```typescript
// Problem: Silent at runtime, fails at build
interface Response {
  users?: User[];
  // Missing: courses, academicSessions, demographics
}

// Solution: Define all possible return shapes
interface Response {
  users?: User[];
  courses?: Course[];
  academicSessions?: AcademicSession[];
  demographics?: Demographic[];
}
```

## Architecture Consistency Tests

Tests that grep for import patterns enforce architectural decisions:

```typescript
// Test ensures centralized config is used
it("should import from centralized config", () => {
  const content = fs.readFileSync(filePath, "utf-8");
  expect(content).toMatch(/from ["']@\/lib\/config\/ai-tools["']/);
});
```

**Warning**: Don't remove "unused" imports if they're enforced by consistency tests.

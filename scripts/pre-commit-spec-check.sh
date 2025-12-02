#!/bin/bash
#
# Pre-commit hook for spec verification
#
# This script checks if the spec YAML was modified and ensures
# generated tests are regenerated before committing.
#
# Installation:
#   cp scripts/pre-commit-spec-check.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
#
# Or add to package.json scripts and use husky:
#   npx husky add .husky/pre-commit "npm run verify:spec"

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}[Pre-commit] Checking spec synchronization...${NC}"

# Check if spec YAML is being committed
SPEC_CHANGED=$(git diff --cached --name-only | grep -E "^spec/vendor-portal-rules\.yaml$" || true)

# Check if generated files are being committed
GENERATED_CHANGED=$(git diff --cached --name-only | grep -E "^tests/generated/|^docs/generated/" || true)

if [ -n "$SPEC_CHANGED" ]; then
    echo -e "${YELLOW}[Pre-commit] Spec YAML modified, regenerating tests...${NC}"

    # Regenerate tests from spec
    npm run generate:spec

    # Check if regeneration produced different output
    if ! git diff --exit-code tests/generated/ docs/generated/ > /dev/null 2>&1; then
        echo -e "${YELLOW}[Pre-commit] Generated files were updated. Adding to commit...${NC}"
        git add tests/generated/ docs/generated/
        echo -e "${GREEN}[Pre-commit] Generated files added to commit.${NC}"
    else
        echo -e "${GREEN}[Pre-commit] Generated files already in sync.${NC}"
    fi
fi

# Always verify sync before commit
echo -e "${YELLOW}[Pre-commit] Verifying spec sync...${NC}"

# Save current state
STASH_NAME="pre-commit-$(date +%s)"
git stash push -q --keep-index -m "$STASH_NAME"

# Run verification
npm run generate:spec

# Check for drift
if ! git diff --exit-code tests/generated/ docs/generated/ > /dev/null 2>&1; then
    echo -e "${RED}[Pre-commit] ERROR: Generated files are out of sync with spec!${NC}"
    echo ""
    echo "The generated test files don't match what the spec would generate."
    echo "Please run: npm run generate:spec"
    echo "Then add the generated files to your commit."
    echo ""

    # Restore stashed changes
    STASH_NUM=$(git stash list | grep "$STASH_NAME" | cut -d: -f1)
    if [ -n "$STASH_NUM" ]; then
        git stash pop -q "$STASH_NUM" 2>/dev/null || true
    fi

    exit 1
fi

# Restore stashed changes
STASH_NUM=$(git stash list | grep "$STASH_NAME" | cut -d: -f1)
if [ -n "$STASH_NUM" ]; then
    git stash pop -q "$STASH_NUM" 2>/dev/null || true
fi

echo -e "${GREEN}[Pre-commit] Spec verification passed!${NC}"

# Optionally run the generated tests
if [ "$RUN_GENERATED_TESTS" = "true" ]; then
    echo -e "${YELLOW}[Pre-commit] Running generated tests...${NC}"
    npm run test:generated
    echo -e "${GREEN}[Pre-commit] All generated tests passed!${NC}"
fi

exit 0

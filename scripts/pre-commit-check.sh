#!/bin/bash
#
# Pre-commit quality gate for SchoolDay Vendor Portal
# Runs typecheck and PII scan before git commit
#
# Exit codes:
#   0 - All checks passed
#   2 - Check failed (blocks commit)
#

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "═══════════════════════════════════════════════════"
echo "  🛡️  PRE-COMMIT QUALITY GATES"
echo "═══════════════════════════════════════════════════"
echo ""

# Gate 1: TypeScript type checking
echo "📝 Gate 1: TypeScript Type Check..."
if npm run typecheck 2>&1; then
    echo -e "${GREEN}✅ TypeScript check passed${NC}"
else
    echo -e "${RED}❌ TypeScript check failed${NC}"
    echo "Fix type errors before committing."
    exit 2
fi

echo ""

# Gate 2: PII pattern scan
echo "🔒 Gate 2: PII Pattern Scan..."
if "$PROJECT_DIR/scripts/pii-check.sh"; then
    echo -e "${GREEN}✅ PII scan passed${NC}"
else
    echo -e "${RED}❌ PII scan failed${NC}"
    exit 2
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo -e "  ${GREEN}✅ ALL QUALITY GATES PASSED${NC}"
echo "═══════════════════════════════════════════════════"
echo ""

exit 0

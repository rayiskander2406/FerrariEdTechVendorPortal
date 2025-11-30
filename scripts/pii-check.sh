#!/bin/bash
#
# PII Pattern Scanner for SchoolDay Vendor Portal
# Scans staged files for potential PII before commit
#
# Exit codes:
#   0 - No PII found
#   2 - PII detected (blocks commit)
#

set -e

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Scanning for PII patterns..."

# Get staged files (for git commit) or all changed files
if git rev-parse --git-dir > /dev/null 2>&1; then
    # We're in a git repo - check staged files
    FILES=$(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null | grep -E '\.(ts|tsx|js|jsx|json|md)$' || true)
    if [ -z "$FILES" ]; then
        # No staged files, check working directory changes
        FILES=$(git diff --name-only --diff-filter=ACMR 2>/dev/null | grep -E '\.(ts|tsx|js|jsx|json|md)$' || true)
    fi
else
    # Not in git, scan all source files
    FILES=$(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -not -path "./node_modules/*" -not -path "./.next/*")
fi

if [ -z "$FILES" ]; then
    echo -e "${GREEN}✅ No files to scan${NC}"
    exit 0
fi

# PII patterns to detect
# Note: We exclude tokenized patterns (TKN_*) as those are safe
PII_PATTERNS=(
    # Email patterns (but not tokenized relay emails)
    '[a-zA-Z0-9._%+-]+@(?!relay\.schoolday)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'

    # Phone numbers (but not TKN_555_* tokens)
    '\b(?!TKN_555)[0-9]{3}[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b'

    # SSN patterns
    '\b[0-9]{3}[-]?[0-9]{2}[-]?[0-9]{4}\b'

    # Date of birth patterns in code (but not [TOKENIZED])
    'dateOfBirth\s*[:=]\s*["\x27][0-9]{4}-[0-9]{2}-[0-9]{2}'

    # Full names with both first and last (but not [TOKENIZED])
    'lastName\s*[:=]\s*["\x27](?!\[TOKENIZED\])[A-Z][a-z]+'

    # Street addresses
    '\b[0-9]+\s+[A-Z][a-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln)\b'
)

FOUND_PII=0
PII_DETAILS=""

for file in $FILES; do
    if [ -f "$file" ]; then
        # Skip files that are allowed to have PII patterns (documentation, tests, examples)
        if [[ "$file" == *".test."* ]] \
            || [[ "$file" == *"synthetic.ts"* ]] \
            || [[ "$file" == *"pii-check.sh"* ]] \
            || [[ "$file" == *"CLAUDE.md"* ]] \
            || [[ "$file" == *"system-prompt.ts"* ]] \
            || [[ "$file" == *"tools.ts"* ]] \
            || [[ "$file" == *"scenarios.ts"* ]] \
            || [[ "$file" == *"demo-workflows.ts"* ]] \
            || [[ "$file" == *"handlers.ts"* ]] \
            || [[ "$file" == *"package.json"* ]] \
            || [[ "$file" == *"package-lock.json"* ]] \
            || [[ "$file" == *"/types/"* ]] \
            || [[ "$file" == *"validate-demo.ts"* ]] \
            || [[ "$file" == *"MOONSHOTS.md"* ]] \
            || [[ "$file" == *"PLANNING.md"* ]] \
            || [[ "$file" == *".claude/"* ]]; then
            continue
        fi

        for pattern in "${PII_PATTERNS[@]}"; do
            # Use grep with Perl regex, suppress output, just detect presence
            if grep -Pq "$pattern" "$file" 2>/dev/null; then
                FOUND_PII=1
                # Get first match line for context
                MATCH_LINE=$(grep -Pn "$pattern" "$file" 2>/dev/null | head -1)
                PII_DETAILS="${PII_DETAILS}\n📍 ${file}: ${MATCH_LINE}"
            fi
        done
    fi
done

if [ $FOUND_PII -eq 1 ]; then
    echo ""
    echo -e "${RED}❌ POTENTIAL PII DETECTED${NC}"
    echo -e "${YELLOW}The following patterns were found that may contain PII:${NC}"
    echo -e "$PII_DETAILS"
    echo ""
    echo "Please ensure all PII is tokenized before committing."
    echo "Valid token formats:"
    echo "  - Student: TKN_STU_[A-Z0-9]{8}"
    echo "  - Parent:  TKN_PAR_[A-Z0-9]{8}"
    echo "  - Email:   TKN_xxx_hash@relay.schoolday.lausd.net"
    echo "  - Phone:   TKN_555_XXX_NNNN"
    echo ""
    exit 2
fi

echo -e "${GREEN}✅ No PII patterns detected${NC}"
exit 0

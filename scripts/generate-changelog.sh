#!/bin/bash
#
# Changelog Generator for SchoolDay Vendor Portal
# Generates user-facing changelog from git commits
#
# Usage: ./scripts/generate-changelog.sh [since_tag]
#

set -e

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR"

SINCE_TAG="${1:-}"
OUTPUT_FILE="CHANGELOG_GENERATED.md"

# Colors
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           CHANGELOG GENERATOR                                ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get the range
if [ -n "$SINCE_TAG" ]; then
    RANGE="$SINCE_TAG..HEAD"
    echo -e "Generating changelog since tag: ${YELLOW}$SINCE_TAG${NC}"
else
    # Get commits from last 7 days
    SINCE_DATE=$(date -v-7d +%Y-%m-%d 2>/dev/null || date -d "7 days ago" +%Y-%m-%d 2>/dev/null || echo "")
    if [ -n "$SINCE_DATE" ]; then
        RANGE="--since=$SINCE_DATE"
        echo -e "Generating changelog for last 7 days (since ${YELLOW}$SINCE_DATE${NC})"
    else
        RANGE="-n 50"
        echo -e "Generating changelog for last 50 commits"
    fi
fi

# Get current version from package.json
VERSION=$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
DATE=$(date +%Y-%m-%d)

# Generate changelog
cat > "$OUTPUT_FILE" << EOF
# Changelog

## [$VERSION] - $DATE

EOF

# Features (feat:)
echo -e "\n${GREEN}Collecting features...${NC}"
FEATURES=$(git log $RANGE --pretty=format:"%s" --grep="^feat:" --grep="^feat(" 2>/dev/null | head -20 || true)
if [ -n "$FEATURES" ]; then
    echo "### 🚀 Features" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "$FEATURES" | while read -r commit; do
        # Remove conventional commit prefix
        clean=$(echo "$commit" | sed 's/^feat[^:]*: //' | sed 's/^feat: //')
        # Capitalize first letter
        clean=$(echo "$clean" | sed 's/^\(.\)/\U\1/')
        echo "- $clean" >> "$OUTPUT_FILE"
    done
    echo "" >> "$OUTPUT_FILE"
fi

# Bug fixes (fix:)
echo -e "${GREEN}Collecting bug fixes...${NC}"
FIXES=$(git log $RANGE --pretty=format:"%s" --grep="^fix:" --grep="^fix(" 2>/dev/null | head -20 || true)
if [ -n "$FIXES" ]; then
    echo "### 🐛 Bug Fixes" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "$FIXES" | while read -r commit; do
        clean=$(echo "$commit" | sed 's/^fix[^:]*: //' | sed 's/^fix: //')
        clean=$(echo "$clean" | sed 's/^\(.\)/\U\1/')
        echo "- $clean" >> "$OUTPUT_FILE"
    done
    echo "" >> "$OUTPUT_FILE"
fi

# Documentation (docs:)
echo -e "${GREEN}Collecting documentation updates...${NC}"
DOCS=$(git log $RANGE --pretty=format:"%s" --grep="^docs:" 2>/dev/null | head -10 || true)
if [ -n "$DOCS" ]; then
    echo "### 📚 Documentation" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "$DOCS" | while read -r commit; do
        clean=$(echo "$commit" | sed 's/^docs[^:]*: //' | sed 's/^docs: //')
        clean=$(echo "$clean" | sed 's/^\(.\)/\U\1/')
        echo "- $clean" >> "$OUTPUT_FILE"
    done
    echo "" >> "$OUTPUT_FILE"
fi

# Performance (perf:)
echo -e "${GREEN}Collecting performance improvements...${NC}"
PERF=$(git log $RANGE --pretty=format:"%s" --grep="^perf:" 2>/dev/null | head -10 || true)
if [ -n "$PERF" ]; then
    echo "### ⚡ Performance" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "$PERF" | while read -r commit; do
        clean=$(echo "$commit" | sed 's/^perf[^:]*: //' | sed 's/^perf: //')
        clean=$(echo "$clean" | sed 's/^\(.\)/\U\1/')
        echo "- $clean" >> "$OUTPUT_FILE"
    done
    echo "" >> "$OUTPUT_FILE"
fi

# Other notable changes
echo -e "${GREEN}Collecting other changes...${NC}"
OTHER=$(git log $RANGE --pretty=format:"%s" 2>/dev/null | grep -v "^feat" | grep -v "^fix" | grep -v "^docs" | grep -v "^perf" | grep -v "^chore" | grep -v "^style" | grep -v "^test" | grep -v "^ci" | grep -v "^build" | grep -v "^refactor" | head -10 || true)
if [ -n "$OTHER" ]; then
    echo "### 📝 Other Changes" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "$OTHER" | while read -r commit; do
        echo "- $commit" >> "$OUTPUT_FILE"
    done
    echo "" >> "$OUTPUT_FILE"
fi

# Add generation note
cat >> "$OUTPUT_FILE" << EOF
---

*Generated automatically by changelog-generator on $DATE*
EOF

echo ""
echo -e "${GREEN}✅ Changelog generated: ${BOLD}$OUTPUT_FILE${NC}"
echo ""
echo "Preview:"
echo "─────────────────────────────────────────"
head -30 "$OUTPUT_FILE"
echo "─────────────────────────────────────────"
echo ""

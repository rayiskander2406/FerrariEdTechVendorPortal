#!/bin/bash
# Render final MP4 video
# Usage: ./render.sh <district-code> <version>
# Example: ./render.sh lausd v1.0

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

DISTRICT="${1:-}"
VERSION="${2:-v1.0}"

if [ -z "$DISTRICT" ]; then
    echo "Usage: $0 <district-code> <version>"
    echo "Example: $0 lausd v1.0"
    exit 1
fi

DISTRICT_DIR="$ROOT_DIR/districts/$DISTRICT/$VERSION"
REMOTION_DIR="$DISTRICT_DIR/remotion"
OUTPUT_DIR="$DISTRICT_DIR/output"

if [ ! -d "$REMOTION_DIR" ]; then
    echo "Error: Remotion project not found: $REMOTION_DIR"
    exit 1
fi

echo "Rendering video for $DISTRICT $VERSION"
echo "======================================="

mkdir -p "$OUTPUT_DIR"

cd "$REMOTION_DIR"

# Render
OUTPUT_FILE="$OUTPUT_DIR/${DISTRICT}-pitch-${VERSION}.mp4"

npx remotion render src/index.tsx Main --output="$OUTPUT_FILE"

# Verify output
if [ -f "$OUTPUT_FILE" ]; then
    echo ""
    echo "Render complete!"
    echo ""

    # Get video info
    duration=$(ffprobe -v quiet -show_entries format=duration \
        -of default=noprint_wrappers=1:nokey=1 "$OUTPUT_FILE")
    size=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')

    echo "Output: $OUTPUT_FILE"
    echo "Duration: ${duration}s"
    echo "Size: $size"
    echo ""

    # Open containing folder
    open "$OUTPUT_DIR"
else
    echo "Error: Render failed"
    exit 1
fi

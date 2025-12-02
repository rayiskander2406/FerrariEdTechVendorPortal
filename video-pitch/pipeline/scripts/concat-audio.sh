#!/bin/bash
# Concatenate scene audio files and output timing info
# Usage: ./concat-audio.sh <district-code> <version>
# Example: ./concat-audio.sh lausd v1.0

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
VOICEOVER_DIR="$DISTRICT_DIR/voiceover"

if [ ! -d "$VOICEOVER_DIR" ]; then
    echo "Error: Voiceover directory not found: $VOICEOVER_DIR"
    echo "Run generate-tts.sh first"
    exit 1
fi

echo "Concatenating audio for $DISTRICT $VERSION"
echo "==========================================="

cd "$VOICEOVER_DIR"

# Create concat list
CONCAT_FILE="concat.txt"
> "$CONCAT_FILE"

for scene in scene1_hook scene2_problem scene3_solution scene4_integration scene5_benefits scene6_leverage scene7_close; do
    if [ -f "${scene}.mp3" ]; then
        echo "file '${scene}.mp3'" >> "$CONCAT_FILE"
    fi
done

# Concatenate
ffmpeg -y -f concat -safe 0 -i "$CONCAT_FILE" -c copy full_voiceover.mp3

# Get total duration
total_duration=$(ffprobe -v quiet -show_entries format=duration \
    -of default=noprint_wrappers=1:nokey=1 full_voiceover.mp3)

echo ""
echo "Total duration: ${total_duration}s"
echo ""

# Output timing info for Remotion
echo "Scene timing for Main.tsx (at 30fps):"
echo "======================================="

cumulative=0
for scene in scene1_hook scene2_problem scene3_solution scene4_integration scene5_benefits scene6_leverage scene7_close; do
    if [ -f "${scene}.mp3" ]; then
        duration=$(ffprobe -v quiet -show_entries format=duration \
            -of default=noprint_wrappers=1:nokey=1 "${scene}.mp3")

        # Extract scene name without prefix
        scene_key=$(echo "$scene" | sed 's/scene[0-9]_//')

        echo "  $scene_key: {start: Math.round($cumulative * 30), duration: Math.round($duration * 30)},"

        cumulative=$(echo "$cumulative + $duration" | bc)
    fi
done

echo ""
echo "Update durationInFrames in Root.tsx:"
echo "  durationInFrames={Math.round($total_duration * 30)}"
echo ""
echo "Audio file: $VOICEOVER_DIR/full_voiceover.mp3"
echo ""

# Copy to Remotion public folder if it exists
REMOTION_VOICEOVER="$DISTRICT_DIR/remotion/public/voiceover"
if [ -d "$REMOTION_VOICEOVER" ]; then
    cp full_voiceover.mp3 "$REMOTION_VOICEOVER/"
    echo "Copied to: $REMOTION_VOICEOVER/full_voiceover.mp3"
fi

echo ""
echo "Next: Update Main.tsx with timing, then run ./scripts/render.sh $DISTRICT $VERSION"

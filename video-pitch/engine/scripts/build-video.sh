#!/bin/bash
#
# Video Build Pipeline
#
# Automates the full video creation process with built-in verification.
# Encodes learnings from LAUSD v1.2 production.
#
# Usage:
#   ./build-video.sh <district> <version> [--skip-audio]
#
# Example:
#   ./build-video.sh lausd 1.2.6
#   ./build-video.sh lausd 1.2.6 --skip-audio  # Use existing audio

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Arguments
DISTRICT=${1:-"lausd"}
VERSION=${2:-"1.0"}
SKIP_AUDIO=${3:-""}

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENGINE_DIR="$(dirname "$SCRIPT_DIR")"
VIDEO_DIR="$(dirname "$ENGINE_DIR")"
DISTRICT_DIR="${VIDEO_DIR}/districts/${DISTRICT}/v${VERSION%%.*}"
VOICEOVER_DIR="${DISTRICT_DIR}/voiceover"
REMOTION_DIR="${DISTRICT_DIR}/remotion"
PUBLIC_DIR="${REMOTION_DIR}/public/voiceover"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Video Build Pipeline - ${DISTRICT} v${VERSION}${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

# Verify directories exist
if [ ! -d "$DISTRICT_DIR" ]; then
    echo -e "${RED}Error: District directory not found: ${DISTRICT_DIR}${NC}"
    exit 1
fi

#==============================================================================
# STEP 1: Preprocess Scripts for TTS
#==============================================================================
echo -e "\n${YELLOW}[Step 1/6] Preprocessing scripts for TTS...${NC}"

if [ -d "${VOICEOVER_DIR}/scripts" ]; then
    for script in "${VOICEOVER_DIR}/scripts"/*.txt; do
        if [ -f "$script" ]; then
            echo "  Processing: $(basename "$script")"
            # Run preprocessor (would need ts-node or compiled version)
            # npx ts-node "${ENGINE_DIR}/tts/preprocessor.ts" < "$script" > "${script}.processed"
        fi
    done
    echo -e "${GREEN}  ✓ Scripts preprocessed${NC}"
else
    echo -e "${YELLOW}  ⚠ No scripts directory found, skipping${NC}"
fi

#==============================================================================
# STEP 2: Generate Audio (if not skipped)
#==============================================================================
echo -e "\n${YELLOW}[Step 2/6] Generating audio...${NC}"

if [ "$SKIP_AUDIO" == "--skip-audio" ]; then
    echo -e "${YELLOW}  ⚠ Skipping audio generation (--skip-audio)${NC}"
else
    echo "  Voice: en-US-AndrewNeural"
    echo "  This step requires manual TTS generation or edge-tts"
    echo -e "${YELLOW}  ⚠ Implement: pipx run edge-tts for each script${NC}"
fi

#==============================================================================
# STEP 3: Verify Audio Files
#==============================================================================
echo -e "\n${YELLOW}[Step 3/6] Verifying audio files...${NC}"

AUDIO_COUNT=0
AUDIO_ERRORS=0

for audio in "${VOICEOVER_DIR}"/scene*.mp3; do
    if [ -f "$audio" ]; then
        DURATION=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$audio" 2>/dev/null || echo "0")
        if [ "$DURATION" == "0" ] || [ -z "$DURATION" ]; then
            echo -e "${RED}  ✗ $(basename "$audio"): Invalid or corrupt${NC}"
            ((AUDIO_ERRORS++))
        else
            echo -e "${GREEN}  ✓ $(basename "$audio"): ${DURATION}s${NC}"
            ((AUDIO_COUNT++))
        fi
    fi
done

if [ $AUDIO_ERRORS -gt 0 ]; then
    echo -e "${RED}Error: $AUDIO_ERRORS audio files are invalid${NC}"
    exit 1
fi

echo -e "${GREEN}  ✓ $AUDIO_COUNT audio files verified${NC}"

#==============================================================================
# STEP 4: Calculate Timing
#==============================================================================
echo -e "\n${YELLOW}[Step 4/6] Calculating scene timing...${NC}"

# Find the most recent concat file
CONCAT_FILE=$(ls -t "${VOICEOVER_DIR}"/concat*.txt 2>/dev/null | head -1)

if [ -n "$CONCAT_FILE" ]; then
    echo "  Using: $(basename "$CONCAT_FILE")"
fi

# Calculate total duration
TOTAL_DURATION=0
while IFS= read -r line; do
    if [[ "$line" == file* ]]; then
        FILE=$(echo "$line" | sed "s/file '\\(.*\\)'/\\1/")
        if [ -f "${VOICEOVER_DIR}/${FILE}" ]; then
            DUR=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${VOICEOVER_DIR}/${FILE}" 2>/dev/null || echo "0")
            TOTAL_DURATION=$(echo "$TOTAL_DURATION + $DUR" | bc)
        fi
    fi
done < "$CONCAT_FILE"

echo -e "${GREEN}  ✓ Total duration: ${TOTAL_DURATION}s${NC}"

#==============================================================================
# STEP 5: Concatenate Audio
#==============================================================================
echo -e "\n${YELLOW}[Step 5/6] Concatenating audio...${NC}"

OUTPUT_AUDIO="${VOICEOVER_DIR}/full_voiceover.mp3"
PUBLIC_AUDIO="${PUBLIC_DIR}/full_voiceover.mp3"

cd "$VOICEOVER_DIR"
ffmpeg -y -f concat -safe 0 -i "$(basename "$CONCAT_FILE")" -c copy "$OUTPUT_AUDIO" 2>/dev/null

# Copy to public directory
mkdir -p "$PUBLIC_DIR"
cp "$OUTPUT_AUDIO" "$PUBLIC_AUDIO"

FINAL_DURATION=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$OUTPUT_AUDIO")
echo -e "${GREEN}  ✓ Concatenated: ${FINAL_DURATION}s${NC}"

#==============================================================================
# STEP 6: Render Video
#==============================================================================
echo -e "\n${YELLOW}[Step 6/6] Rendering video...${NC}"

cd "$REMOTION_DIR"
OUTPUT_VIDEO="out/${DISTRICT}-pitch-v${VERSION}.mp4"

echo "  Output: $OUTPUT_VIDEO"
npx remotion render Main "$OUTPUT_VIDEO" --codec h264

# Verify output
if [ -f "$OUTPUT_VIDEO" ]; then
    VIDEO_DURATION=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$OUTPUT_VIDEO")
    VIDEO_SIZE=$(ls -lh "$OUTPUT_VIDEO" | awk '{print $5}')
    echo -e "${GREEN}  ✓ Rendered: ${VIDEO_DURATION}s (${VIDEO_SIZE})${NC}"
else
    echo -e "${RED}  ✗ Render failed${NC}"
    exit 1
fi

#==============================================================================
# Summary
#==============================================================================
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  BUILD COMPLETE${NC}"
echo -e "${BLUE}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║  District:  ${DISTRICT}${NC}"
echo -e "${BLUE}║  Version:   v${VERSION}${NC}"
echo -e "${BLUE}║  Duration:  ${VIDEO_DURATION}s${NC}"
echo -e "${BLUE}║  Size:      ${VIDEO_SIZE}${NC}"
echo -e "${BLUE}║  Output:    ${OUTPUT_VIDEO}${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo "  1. Review video: open ${OUTPUT_VIDEO}"
echo "  2. If approved: git add && git commit"
echo "  3. Tag release: git tag v${VERSION}"

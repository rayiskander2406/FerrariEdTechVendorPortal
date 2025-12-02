#!/bin/bash
# Generate TTS voiceover from script
# Usage: ./generate-tts.sh <district-code> <version> [voice]
# Example: ./generate-tts.sh lausd v1.0 en-US-AndrewNeural

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

DISTRICT="${1:-}"
VERSION="${2:-v1.0}"
VOICE="${3:-en-US-AndrewNeural}"

if [ -z "$DISTRICT" ]; then
    echo "Usage: $0 <district-code> <version> [voice]"
    echo "Example: $0 lausd v1.0 en-US-AndrewNeural"
    echo ""
    echo "Available voices:"
    echo "  en-US-AndrewNeural  - Confident, Warm (recommended)"
    echo "  en-US-GuyNeural     - Professional"
    echo "  en-US-JennyNeural   - Friendly"
    exit 1
fi

DISTRICT_DIR="$ROOT_DIR/districts/$DISTRICT/$VERSION"
VOICEOVER_DIR="$DISTRICT_DIR/voiceover"

if [ ! -d "$DISTRICT_DIR" ]; then
    echo "Error: District directory not found: $DISTRICT_DIR"
    exit 1
fi

# Check for edge-tts
if ! command -v edge-tts &> /dev/null; then
    echo "Installing edge-tts..."
    pip install edge-tts
fi

echo "Generating TTS for $DISTRICT $VERSION"
echo "Voice: $VOICE"
echo "========================================"

mkdir -p "$VOICEOVER_DIR"

# Scene texts - customize these based on SCRIPT.md
# These are the LAUSD defaults; modify for each district

declare -a SCENES=(
    "scene1_hook:Six hundred seventy thousand students. One thousand schools. Hundreds of EdTek vendors requesting access to student data every year. Each one takes weeks to review. That's about to change."
    "scene2_problem:Right now, your privacy team is drowning. 71-question applications. Weeks of manual review per vendor. Meanwhile, vendors are paying Clever 16 to 19 dollars per school per month, and passing those costs back to you."
    "scene3_solution:SchoolDay flips the model. Vendors complete a 13-question Pods Light application and get approved in minutes. How? Tokenization. 80 percent of vendors never touch actual student P. I. I. They get secure tokens with zero privacy risk."
    "scene4_integration:One platform, every integration type. S. S. O. with SAM-L and Open I.D. Connect. Rostering with One Roster and Ed-Fi. L. T. I. 1.3 for deep content linking. And tokenized messaging, so vendors can communicate with students and parents without ever seeing real emails or phone numbers."
    "scene5_benefits:For L. A. U. S. D., this means three things. One, 80 percent fewer manual reviews. Two, automatic compliance logging for FER-pah and COP-pah. Three, SchoolDay is your platform. No Clever fees. No middleman."
    "scene6_leverage:Vendors using SchoolDay save thousands in integration fees. They eliminate privacy liability. They get instant access instead of waiting weeks. You're giving them massive value. That means leverage."
    "scene7_close:Demand significant discounts from vendors in exchange for secure, streamlined access. SchoolDay makes it possible. Let's talk."
)

for scene_data in "${SCENES[@]}"; do
    IFS=':' read -r scene_name scene_text <<< "$scene_data"
    echo ""
    echo "Generating: $scene_name"

    edge-tts --voice "$VOICE" \
        --text "$scene_text" \
        --write-media "$VOICEOVER_DIR/${scene_name}.mp3"

    # Get duration
    duration=$(ffprobe -v quiet -show_entries format=duration \
        -of default=noprint_wrappers=1:nokey=1 \
        "$VOICEOVER_DIR/${scene_name}.mp3")

    echo "  Duration: ${duration}s"
done

echo ""
echo "TTS generation complete!"
echo "Files in: $VOICEOVER_DIR"
echo ""
echo "Next: Run ./scripts/concat-audio.sh $DISTRICT $VERSION"

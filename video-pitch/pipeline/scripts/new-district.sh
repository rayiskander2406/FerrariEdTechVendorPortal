#!/bin/bash
# Create a new district pitch project from template
# Usage: ./new-district.sh <district-code> [version]
# Example: ./new-district.sh sfusd v1.0

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

DISTRICT="${1:-}"
VERSION="${2:-v1.0}"

if [ -z "$DISTRICT" ]; then
    echo "Usage: $0 <district-code> [version]"
    echo "Example: $0 sfusd v1.0"
    exit 1
fi

DISTRICT_DIR="$ROOT_DIR/districts/$DISTRICT/$VERSION"

if [ -d "$DISTRICT_DIR" ]; then
    echo "Error: Directory already exists: $DISTRICT_DIR"
    exit 1
fi

echo "Creating new district pitch: $DISTRICT $VERSION"
echo "=============================================="

# Create directory structure
mkdir -p "$DISTRICT_DIR"/{voiceover,output}

# Create SCRIPT.md template
cat > "$DISTRICT_DIR/SCRIPT.md" << 'EOF'
# [DISTRICT_NAME] Video Pitch Script

## Target: 90-second explainer video for [TITLE] [NAME]

---

### Scene 1: Hook [0:00-0:10]
> "[X] thousand students. [Y] schools. Hundreds of EdTek vendors requesting access to student data every year. Each one takes weeks to review. That's about to change."

### Scene 2: Problem [0:10-0:23]
> "Right now, your privacy team is drowning. 71-question applications. Weeks of manual review per vendor. Meanwhile, vendors are paying Clever 16 to 19 dollars per school per month, and passing those costs back to you."

### Scene 3: Solution [0:23-0:37]
> "SchoolDay flips the model. Vendors complete a 13-question Pods Light application and get approved in minutes. How? Tokenization. 80 percent of vendors never touch actual student P. I. I. They get secure tokens with zero privacy risk."

### Scene 4: Integration [0:37-0:54]
> "One platform, every integration type. S. S. O. with SAM-L and Open I.D. Connect. Rostering with One Roster and Ed-Fi. L. T. I. 1.3 for deep content linking. And tokenized messaging, so vendors can communicate with students and parents without ever seeing real emails or phone numbers."

### Scene 5: Benefits [0:54-1:07]
> "For [DISTRICT], this means three things. One, 80 percent fewer manual reviews. Two, automatic compliance logging for FER-pah and COP-pah. Three, SchoolDay is your platform. No Clever fees. No middleman."

### Scene 6: Leverage [1:07-1:18]
> "Vendors using SchoolDay save thousands in integration fees. They eliminate privacy liability. They get instant access instead of waiting weeks. You're giving them massive value. That means leverage."

### Scene 7: Close [1:18-1:30]
> "Demand significant discounts from vendors in exchange for secure, streamlined access. SchoolDay makes it possible. Let's talk."

---

## Customization Checklist
- [ ] Replace [DISTRICT_NAME] with district name
- [ ] Replace [X] with student count
- [ ] Replace [Y] with school count
- [ ] Replace [TITLE] [NAME] with recipient info
- [ ] Update any district-specific details
EOF

# Create STORYBOARD.md template
cat > "$DISTRICT_DIR/STORYBOARD.md" << 'EOF'
# [DISTRICT_NAME] Video Pitch Storyboard

## Visual Style
- Clean, modern, professional
- SchoolDay brand colors
- Smooth animations and transitions
- 1920x1080 @ 30fps

---

## Scene Breakdown

### Scene 1: Hook
**Visual**: Large animated counter showing student/school numbers
**Motion**: Numbers counting up dramatically
**Color**: Deep blue gradient background

### Scene 2: Problem
**Visual**: Overwhelmed desk with stacking papers
**Motion**: Papers piling up, clock spinning
**Color**: Warm amber (stress/urgency)

### Scene 3: Solution
**Visual**: SchoolDay logo with token animation
**Motion**: 71 → 13 question count animation
**Color**: Cool green (relief/solution)

### Scene 4: Integration
**Visual**: Integration type icons (SSO, LTI, etc.)
**Motion**: Icons appearing in grid formation
**Color**: Purple gradient (tech/capability)

### Scene 5: Benefits
**Visual**: Three benefit cards animated in
**Motion**: Checkmarks appearing
**Color**: SchoolDay blue

### Scene 6: Leverage
**Visual**: Balance scale tipping toward district
**Motion**: Value items stacking
**Color**: Gold/amber (value)

### Scene 7: Close
**Visual**: CTA with contact info
**Motion**: Fade in with subtle pulse
**Color**: SchoolDay brand colors
EOF

# Create CHANGELOG.md
cat > "$DISTRICT_DIR/CHANGELOG.md" << EOF
# $DISTRICT Video Pitch - $VERSION Changelog

## $VERSION ($(date +%B\ %d,\ %Y))

### Initial Setup
- Created from pipeline template
- Pending: Script customization
- Pending: Voiceover generation
- Pending: Remotion scenes
- Pending: Final render
EOF

echo ""
echo "Created: $DISTRICT_DIR"
echo ""
echo "Next steps:"
echo "  1. Edit $DISTRICT_DIR/SCRIPT.md with district-specific content"
echo "  2. Run: ./scripts/generate-tts.sh $DISTRICT $VERSION"
echo "  3. Run: ./scripts/concat-audio.sh $DISTRICT $VERSION"
echo "  4. Create Remotion project with scenes"
echo "  5. Run: ./scripts/render.sh $DISTRICT $VERSION"
echo ""

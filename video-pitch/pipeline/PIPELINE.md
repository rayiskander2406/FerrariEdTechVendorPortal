# Video Pitch Pipeline v1.0

## Overview

This pipeline produces professional explainer videos for district superintendent pitches. It uses open-source, AI-powered tools to generate voiceover and programmatic video rendering.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        VIDEO PITCH PIPELINE v1.0                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SCRIPT.md ─────┐                                                       │
│                 │                                                       │
│                 ▼                                                       │
│  ┌─────────────────────────────┐                                        │
│  │     EDGE TTS (Neural)       │  Voice: en-US-AndrewNeural             │
│  │     scripts/generate-tts.sh │  Quality: High, natural prosody        │
│  └──────────────┬──────────────┘                                        │
│                 │                                                       │
│                 ▼                                                       │
│  ┌─────────────────────────────┐                                        │
│  │     FFMPEG (Concatenate)    │  Merge scenes → single track           │
│  │     scripts/concat-audio.sh │  Measure durations for sync            │
│  └──────────────┬──────────────┘                                        │
│                 │                                                       │
│                 ▼                                                       │
│  ┌─────────────────────────────┐                                        │
│  │     REMOTION (React Video)  │  Programmatic animation                │
│  │     Main.tsx scenes         │  Scene timing from audio durations     │
│  └──────────────┬──────────────┘                                        │
│                 │                                                       │
│                 ▼                                                       │
│  ┌─────────────────────────────┐                                        │
│  │     MP4 OUTPUT              │  H.264 + AAC, 1920x1080                │
│  │     output/*.mp4            │  Ready for sharing                     │
│  └─────────────────────────────┘                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Component | Tool | Version | Purpose |
|-----------|------|---------|---------|
| **TTS** | Edge TTS | Latest | Microsoft Neural voices (free, high quality) |
| **Audio** | FFmpeg | 6.x+ | Concatenation, duration measurement |
| **Video** | Remotion | 4.x | React-based programmatic video |
| **Render** | Remotion CLI | 4.x | MP4 export |

## Prerequisites

```bash
# Node.js 18+
node --version

# Python 3.x with pip
python3 --version

# FFmpeg
brew install ffmpeg  # macOS
apt install ffmpeg   # Ubuntu

# Edge TTS
pip install edge-tts
```

## Quick Start (New District)

```bash
# 1. Create district directory
./scripts/new-district.sh <district-code>

# 2. Customize script
vi districts/<district-code>/v1.0/SCRIPT.md

# 3. Generate voiceover
./scripts/generate-tts.sh <district-code> v1.0

# 4. Concatenate audio
./scripts/concat-audio.sh <district-code> v1.0

# 5. Update Remotion scenes with new timing
# (Update districts/<district-code>/v1.0/remotion/src/Main.tsx)

# 6. Preview
cd districts/<district-code>/v1.0/remotion && npm start

# 7. Render
./scripts/render.sh <district-code> v1.0
```

## Detailed Pipeline Steps

### Step 1: Script Development

Create `SCRIPT.md` with scene-by-scene content:

```markdown
### Scene 1: Hook [0:00-0:10]
> "Six hundred seventy thousand students..."

### Scene 2: Problem [0:10-0:23]
> "Right now, your privacy team is drowning..."
```

**Best Practices:**
- Write for spoken word (contractions, natural flow)
- Use phonetic spellings for acronyms (L.A.U.S.D., S.S.O.)
- Target 90-120 seconds total
- 7 scenes is optimal for pacing

### Step 2: TTS Generation

```bash
# Generate individual scene audio
edge-tts --voice en-US-AndrewNeural \
  --text "Your script text here" \
  --write-media scene1.mp3
```

**Voice Options:**
| Voice | Style | Best For |
|-------|-------|----------|
| en-US-AndrewNeural | Confident, Warm | Executive pitches |
| en-US-GuyNeural | Professional | Technical demos |
| en-US-JennyNeural | Friendly | Training videos |

### Step 3: Audio Concatenation

```bash
# Create concat list
echo "file 'scene1.mp3'" > concat.txt
echo "file 'scene2.mp3'" >> concat.txt
# ...

# Concatenate
ffmpeg -f concat -safe 0 -i concat.txt -c copy full_voiceover.mp3

# Get duration
ffprobe -v quiet -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 full_voiceover.mp3
```

### Step 4: Remotion Scene Timing

Measure each scene duration and update `Main.tsx`:

```typescript
const SCENES = {
  hook: {start: 0, duration: Math.round(10.344 * 30)},
  problem: {start: Math.round(10.344 * 30), duration: Math.round(13.008 * 30)},
  // ... calculated from actual audio durations
};
```

**Critical:** Scene timing MUST match actual audio durations to prevent desync.

### Step 5: Render to MP4

```bash
npx remotion render src/index.tsx Main \
  --output=../output/pitch-v1.0.mp4
```

## Versioning Strategy

```
districts/
├── lausd/
│   ├── v1.0/         # Initial release
│   ├── v1.1/         # Minor improvements
│   └── v2.0/         # Major revision
├── sfusd/
│   └── v1.0/
└── nycdoe/
    └── v1.0/
```

**Version Bumps:**
- **Patch (v1.0.1)**: Bug fixes, typo corrections
- **Minor (v1.1.0)**: New scenes, improved visuals
- **Major (v2.0.0)**: Complete redesign, new messaging

## Customization Points

### Per-District Variables

| Variable | Example | Location |
|----------|---------|----------|
| Student count | "670,000 students" | SCRIPT.md |
| School count | "1,000 schools" | SCRIPT.md |
| LMS name | "Schoology" | SCRIPT.md |
| District acronym | "L.A.U.S.D." | SCRIPT.md |
| Brand colors | `#003DA5` | Main.tsx |

### Shared Assets

Place reusable assets in `shared/`:
- SchoolDay logo
- Common animations
- Sound effects (if added)

## Troubleshooting

### Audio out of sync
- **Cause**: Hardcoded durations don't match audio
- **Fix**: Re-measure with ffprobe, update SCENES object

### Garbled pronunciation
- **Cause**: TTS struggles with acronyms
- **Fix**: Use phonetic spellings (EdTek, L.A.U.S.D.)

### Multiple audio tracks playing
- **Cause**: Multiple `<Audio>` components
- **Fix**: Single concatenated audio file

## Evolution Roadmap

### v1.1 (Planned)
- [ ] Automated duration extraction script
- [ ] Template scene library
- [ ] Background music integration

### v1.2 (Planned)
- [ ] Screen recording integration
- [ ] Animated data visualizations
- [ ] Multi-language support

### v2.0 (Future)
- [ ] LLM-powered script generation
- [ ] AI avatar (HeyGen/Synthesia style)
- [ ] Interactive web version

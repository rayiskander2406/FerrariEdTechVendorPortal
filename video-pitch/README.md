# SchoolDay Video Pitch System

AI-powered video pitch generation for district superintendent presentations.

## Overview

This system generates professional 90-second explainer videos tailored to each school district. Videos highlight SchoolDay's value propositions:

- **Privacy protection** via tokenization
- **Operational efficiency** (80% faster vendor approvals)
- **Cost savings** (no Clever fees)
- **Leverage** for vendor discount negotiations

## Quick Start

### Create a New District Pitch

```bash
# 1. Create new district project
./pipeline/scripts/new-district.sh sfusd v1.0

# 2. Customize the script
vi districts/sfusd/v1.0/SCRIPT.md

# 3. Generate voiceover
./pipeline/scripts/generate-tts.sh sfusd v1.0

# 4. Concatenate audio (shows timing for Remotion)
./pipeline/scripts/concat-audio.sh sfusd v1.0

# 5. Create/update Remotion scenes with timing
# (See pipeline/PIPELINE.md for details)

# 6. Render final video
./pipeline/scripts/render.sh sfusd v1.0
```

## Directory Structure

```
video-pitch/
├── README.md                  # This file
├── pipeline/                  # Reusable pipeline (v1.0)
│   ├── PIPELINE.md            # Full pipeline documentation
│   ├── VIDEO_PRODUCTION_GUIDE.md
│   ├── scripts/
│   │   ├── new-district.sh    # Create new district project
│   │   ├── generate-tts.sh    # Generate Edge TTS voiceover
│   │   ├── concat-audio.sh    # Concatenate + timing output
│   │   └── render.sh          # Render MP4
│   └── templates/             # Shared scene templates
├── districts/                 # Per-district pitches
│   ├── lausd/
│   │   └── v1.0/              # LAUSD v1.0 (released Dec 2, 2025)
│   │       ├── SCRIPT.md
│   │       ├── STORYBOARD.md
│   │       ├── VIDEO_PITCH_PLAN.md
│   │       ├── CHANGELOG.md
│   │       ├── voiceover/
│   │       ├── remotion/
│   │       └── output/
│   ├── sfusd/                 # (future)
│   └── nycdoe/                # (future)
├── shared/                    # Cross-district assets
│   └── assets/
└── tts-env/                   # Python TTS environment
```

## Current Releases

| District | Version | Duration | Status | Date |
|----------|---------|----------|--------|------|
| **LAUSD** | v1.0 | 85.7s | Released | Dec 2, 2025 |

## Tech Stack

| Component | Tool | Purpose |
|-----------|------|---------|
| **TTS** | Edge TTS | Microsoft Neural voices (free) |
| **Video** | Remotion | React-based programmatic video |
| **Audio** | FFmpeg | Processing & concatenation |
| **Render** | Remotion CLI | MP4 export |

## Pipeline Version

**Current: v1.0**

See [pipeline/PIPELINE.md](pipeline/PIPELINE.md) for:
- Detailed pipeline documentation
- Customization points
- Troubleshooting guide
- Evolution roadmap

## Best Practices Across Districts

As we create pitches for multiple districts, these patterns emerge:

1. **Phonetic spellings** for acronyms (L.A.U.S.D., S.S.O.)
2. **Single audio track** prevents sync issues
3. **Scene timing from ffprobe** ensures accuracy
4. **Edge TTS** with AndrewNeural voice sounds professional
5. **~90 second** total length is optimal

## Contributing

When creating a new district pitch:
1. Use `new-district.sh` to scaffold
2. Customize SCRIPT.md with district-specific numbers
3. Follow existing scene structure for consistency
4. Document learnings in CHANGELOG.md
5. Share reusable improvements back to `pipeline/`

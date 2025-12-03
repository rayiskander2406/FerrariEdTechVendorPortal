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

| District | Version | Duration | Status | Date | Notes |
|----------|---------|----------|--------|------|-------|
| **LAUSD** | v1.2.8 | 93.5s | **PRODUCTION** | Dec 3, 2024 | Kokoro TTS + cross-fades |
| **LAUSD** | v1.2.6 | 93.5s | Archived | Dec 3, 2024 | Kokoro TTS + music |
| **LAUSD** | v1.0 | 85.7s | Archived | Dec 2, 2024 | Edge TTS baseline |

### LAUSD v1.2.8 Highlights
- **TTS Engine:** Kokoro-ONNX (local, Apache 2.0)
- **Voice:** am_michael (natural male voice)
- **Audio:** Strategic pauses (0.3s phrase, 0.8s scene)
- **Music:** Bensound "Inspire" at 8% volume
- **Transitions:** 0.4s cross-fade between all scenes
- **Details:** See [districts/lausd/v1.2/VERSION_HISTORY.md](districts/lausd/v1.2/VERSION_HISTORY.md)

## Tech Stack

| Component | Tool | Purpose |
|-----------|------|---------|
| **TTS (New)** | Kokoro-ONNX | Local neural TTS, 82M params, Apache 2.0 |
| **TTS (Legacy)** | Edge TTS | Microsoft Neural voices (Azure) |
| **Video** | Remotion | React-based programmatic video |
| **Audio** | FFmpeg | Processing & concatenation |
| **Render** | Remotion CLI | MP4 export |

### Advanced TTS Capabilities

The Kokoro-ONNX engine supports advanced features for professional narration:

| Capability | Control | Documentation |
|------------|---------|---------------|
| **IPA Phonemes** | Exact pronunciation, deterministic regeneration | [TTS_CAPABILITIES.md](engine/TTS_CAPABILITIES.md) |
| **Voice Blending** | Mix voices (e.g., 70% sarah + 30% bella) for tonal variation | [TTS_CAPABILITIES.md](engine/TTS_CAPABILITIES.md) |
| **Speed Control** | 0.85x-1.05x for urgency/gravitas | [TTS_CAPABILITIES.md](engine/TTS_CAPABILITIES.md) |
| **Stress Marks** | IPA ˈ and ˌ for emphasis control | [TTS_CAPABILITIES.md](engine/TTS_CAPABILITIES.md) |

See [engine/TTS_CAPABILITIES.md](engine/TTS_CAPABILITIES.md) for full documentation.

## Pipeline Version

**Current: v2.0** (Kokoro TTS)

| Version | TTS Engine | Features |
|---------|------------|----------|
| **v2.0** | Kokoro-ONNX | Local, strategic pauses, music, auto-timing |
| v1.0 | Edge TTS | Azure-based, basic concatenation |

See [pipeline/PIPELINE_v2.md](pipeline/PIPELINE_v2.md) for:
- Detailed pipeline documentation
- Customization points
- Troubleshooting guide
- Evolution roadmap

## Best Practices Across Districts

As we create pitches for multiple districts, these patterns emerge:

1. **Phonetic spellings** for acronyms (L.A.U.S.D., S.S.O., L-T-I)
2. **Single audio track** prevents sync issues
3. **Scene timing from ffprobe** ensures accuracy
4. **Kokoro TTS** with am_michael voice sounds natural (Apache 2.0, local)
5. **~90 second** total length is optimal
6. **Real silence files** for pauses (Kokoro doesn't support SSML)
7. **Background music at 8%** adds polish without distraction
8. **Update video timings** when changing TTS engine (durations will differ!)

## Graduation Criteria (Extract to Own Repo)

This pipeline is incubating here. Extract to `video-pitch-pipeline` repo when:

- [ ] **3+ districts** created successfully (proves reusability)
- [ ] **Remotion template** is generic (no hardcoded district references)
- [ ] **Scripts work standalone** (no dependency on parent project)
- [ ] **Documentation complete** (setup from scratch works)
- [ ] **CI/CD ready** (automated rendering pipeline)

**Current progress**: 1/3 districts (LAUSD)

---

## Contributing

When creating a new district pitch:
1. Use `new-district.sh` to scaffold
2. Customize SCRIPT.md with district-specific numbers
3. Follow existing scene structure for consistency
4. Document learnings in CHANGELOG.md
5. Share reusable improvements back to `pipeline/`

# Video Production Guide - SchoolDay Pitch Video

## Recommended Stack

Based on your requirements (open-source, installable, fast, polished, AI-generated), here's the recommended stack:

| Component | Tool | Why |
|-----------|------|-----|
| **Motion Graphics** | Remotion | React-based, programmatic, iterative |
| **Voiceover** | Coqui TTS (XTTS-v2) | High-quality, voice cloning, local |
| **Fallback TTS** | Piper | Lighter weight, fast, offline |
| **Export** | FFmpeg | Bundled with Remotion |

---

## Option 1: Remotion + Coqui TTS (Recommended)

### Prerequisites
- Node.js 18+
- Python 3.9+ (for Coqui)
- FFmpeg (auto-installed by Remotion)
- GPU recommended for faster TTS

### Step 1: Install Coqui TTS for Voiceover

```bash
# Create Python virtual environment
python3 -m venv video-tts
source video-tts/bin/activate

# Install Coqui TTS
pip install coqui-tts

# Test installation
tts --list_models

# Generate test audio (XTTS-v2 for best quality)
tts --text "670,000 students. 1,000 schools." \
    --model_name tts_models/multilingual/multi-dataset/xtts_v2 \
    --language_idx en \
    --out_path test_audio.wav
```

### Step 2: Create Remotion Project

```bash
# Navigate to video-pitch directory
cd /Users/rayiskander/FerrariEdTechVendorPortal/video-pitch

# Create new Remotion project
npx create-video@latest schoolday-pitch --template blank

cd schoolday-pitch

# Install dependencies
npm install

# Start development server
npm start
```

### Step 3: Generate Full Voiceover

Create a script to generate all voiceover segments:

```bash
# Create voiceover directory
mkdir -p voiceover

# Generate each scene's audio
source video-tts/bin/activate

# Scene 1: Hook
tts --text "670,000 students. 1,000 schools. Hundreds of EdTech vendors requesting access to student data every year. Each one takes weeks to review. That's about to change." \
    --model_name tts_models/multilingual/multi-dataset/xtts_v2 \
    --language_idx en \
    --out_path voiceover/scene1_hook.wav

# Scene 2: Problem
tts --text "Right now, your privacy team is drowning. 71-question applications. Weeks of manual review per vendor. Meanwhile, vendors are paying Clever 16 to 19 dollars per school per month just to connect—and passing those costs back to you. It's slow, expensive, and risky." \
    --model_name tts_models/multilingual/multi-dataset/xtts_v2 \
    --language_idx en \
    --out_path voiceover/scene2_problem.wav

# Scene 3: Solution
tts --text "SchoolDay's Vendor Portal flips the model. Vendors complete a 13-question PoDS-Lite application and get approved in minutes—not weeks. How? Tokenization. 80 percent of vendors never need to touch actual student PII. They get tokens like TKN_STU_8X9Y2Z that work perfectly for personalization, progress tracking, and analytics—with zero privacy risk." \
    --model_name tts_models/multilingual/multi-dataset/xtts_v2 \
    --language_idx en \
    --out_path voiceover/scene3_solution.wav

# Scene 4: LAUSD Benefits
tts --text "For LAUSD, this means three things: One, your privacy team handles 80 percent fewer manual reviews. Two, every data access is automatically logged and auditable—FERPA, COPPA, and California Ed Code compliance built in. Three, SchoolDay is your platform. No Clever fees. No middleman." \
    --model_name tts_models/multilingual/multi-dataset/xtts_v2 \
    --language_idx en \
    --out_path voiceover/scene4_benefits.wav

# Scene 5: Vendor Leverage
tts --text "Here's where it gets strategic. Vendors using SchoolDay save thousands in integration fees and eliminate their privacy liability entirely. They get instant access instead of waiting weeks. You're giving them massive value—and that means leverage." \
    --model_name tts_models/multilingual/multi-dataset/xtts_v2 \
    --language_idx en \
    --out_path voiceover/scene5_leverage.wav

# Scene 6: Close
tts --text "Demand significant discounts from vendors in exchange for this streamlined, secure access. SchoolDay makes it possible. Let's talk." \
    --model_name tts_models/multilingual/multi-dataset/xtts_v2 \
    --language_idx en \
    --out_path voiceover/scene6_close.wav
```

### Step 4: Render Final Video

```bash
# Render video
npx remotion render src/Root.tsx Main --output=output/schoolday-pitch.mp4
```

---

## Option 2: Piper TTS (Lighter Weight)

If Coqui requires too much VRAM, use Piper:

```bash
# Install Piper
pip install piper-tts

# Download a voice model (e.g., lessac for professional voice)
# Models available at: https://github.com/rhasspy/piper/releases

# Generate audio
echo "670,000 students. 1,000 schools." | piper \
  --model en_US-lessac-medium \
  --output_file voiceover/scene1.wav
```

---

## Option 3: Quick Web-Based Alternative (Canva + Edge TTS)

If you want faster iteration without local setup:

1. **Microsoft Edge TTS** (free, browser-based):
   - Open Edge browser
   - Use built-in Read Aloud feature
   - Record with OBS or audio capture

2. **Canva** (free tier available):
   - Import storyboard visuals
   - Use Canva's animation presets
   - Export as MP4

---

## Alternative AI Video Tools (Text-to-Video)

For fully AI-generated visuals (not motion graphics):

### Wan 2.1 (Consumer-friendly)
```bash
# Requires RTX 4090 or similar (8GB+ VRAM)
pip install diffusers transformers accelerate
# Use via ComfyUI or Gradio interface
```

### LTXVideo (12GB VRAM minimum)
- Runs on mid-tier GPUs
- Supports text-to-video and image-to-video
- Good for b-roll and transitions

### Open-Sora 2.0
- Most capable open-source model
- Requires significant compute (A100 recommended)
- Best for cinematic quality

---

## Recommended Workflow

1. **Generate voiceover first** using Coqui TTS
2. **Time the script** - each scene's duration
3. **Build motion graphics** in Remotion to match audio timing
4. **Iterate on visuals** (Remotion hot-reloads)
5. **Export final video** at 1080p

---

## Hardware Requirements

| Tool | Minimum | Recommended |
|------|---------|-------------|
| Coqui XTTS-v2 | 8GB VRAM | 12GB+ VRAM |
| Piper TTS | CPU only | Any |
| Remotion | 8GB RAM | 16GB RAM |
| Wan 2.1 | 8GB VRAM | 24GB+ VRAM |

---

## Quick Start Commands

```bash
# Full setup (Mac/Linux)
cd /Users/rayiskander/FerrariEdTechVendorPortal/video-pitch

# 1. TTS Setup
python3 -m venv tts-env
source tts-env/bin/activate
pip install coqui-tts

# 2. Remotion Setup
npx create-video@latest schoolday-pitch --template blank
cd schoolday-pitch
npm install
npm start

# 3. Open browser to http://localhost:3000 to preview
```

---

## File Structure After Setup

```
video-pitch/
├── SCRIPT.md              # Your approved script
├── STORYBOARD.md          # Visual directions
├── VIDEO_PRODUCTION_GUIDE.md  # This file
├── voiceover/             # Generated audio files
│   ├── scene1_hook.wav
│   ├── scene2_problem.wav
│   ├── scene3_solution.wav
│   ├── scene4_benefits.wav
│   ├── scene5_leverage.wav
│   └── scene6_close.wav
├── schoolday-pitch/       # Remotion project
│   ├── src/
│   │   ├── Root.tsx       # Main composition
│   │   ├── Scene1.tsx     # Hook scene
│   │   ├── Scene2.tsx     # Problem scene
│   │   └── ...
│   ├── public/
│   │   ├── voiceover/     # Copy audio here
│   │   └── assets/        # Logos, icons
│   └── package.json
└── output/
    └── schoolday-pitch.mp4  # Final video
```

---

## Sources

- [Remotion - Make videos programmatically](https://www.remotion.dev/)
- [Coqui TTS - Deep learning text-to-speech](https://github.com/idiap/coqui-ai-TTS)
- [Piper TTS - Fast offline TTS](https://github.com/rhasspy/piper)
- [Open-Sora 2.0](https://github.com/hpcaitech/Open-Sora)
- [LTXVideo](https://github.com/Lightricks/LTX-Video)
- [Wan 2.1 Video Generation](https://huggingface.co/Wan-AI/Wan2.1-T2V-1.3B)

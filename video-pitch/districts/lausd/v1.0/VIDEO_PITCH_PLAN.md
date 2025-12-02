# LAUSD Video Pitch v1.0 - Project Plan

**Created**: December 2, 2025
**Target**: 90-second explainer video for LAUSD Superintendent
**Status**: 🚧 In Progress (MVP complete, v1.0 refinement in progress)

---

## Current Status: v1.0 Refinement

```
╔══════════════════════════════════════════════════════════════════════════╗
║                    VIDEO PITCH v1.0 PROJECT PLAN                         ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  GOAL: Production-ready 90-second pitch video for LAUSD Superintendent   ║
║  TARGET: Highlight SchoolDay value props, demand vendor discounts        ║
║                                                                          ║
║  ┌────────────────────────────────────────────────────────────────────┐ ║
║  │ COMPLETED (MVP)                     │ v1.0 REFINEMENTS             │ ║
║  ├─────────────────────────────────────┼──────────────────────────────┤ ║
║  │ ✅ Script written (228 words)       │ 📋 VP-01: Fix pronunciation  │ ║
║  │ ✅ Storyboard created (7 scenes)    │    EdTech→EdTek, LAUSD fix   │ ║
║  │ ✅ Coqui TTS installed              │ 📋 VP-02: Speed up to 1.5X   │ ║
║  │ ✅ 6 voiceover files generated      │    Use FFmpeg tempo filter   │ ║
║  │ ✅ Remotion project created         │ 📋 VP-03: Add tokenized comm │ ║
║  │ ✅ 6 animated scenes built          │    Highlight relay messaging │ ║
║  │ ✅ Studio running (localhost:3000)  │ 📋 VP-04: Add integration    │ ║
║  │                                     │    breadth (SSO, LTI, etc)   │ ║
║  │                                     │ 📋 VP-05: Regenerate audio   │ ║
║  │                                     │    All scenes with fixes     │ ║
║  │                                     │ 📋 VP-06: Update scenes      │ ║
║  │                                     │    New content + timing      │ ║
║  │                                     │ 📋 VP-07: Final render       │ ║
║  │                                     │    Export MP4 for delivery   │ ║
║  └─────────────────────────────────────┴──────────────────────────────┘ ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## v1.0 Requirements

### MUST HAVE (P1) - Block release if not done

#### VP-01: Fix Audio Pronunciation Issues
**Problem**: TTS mispronounces key terms
**Solution**: Rewrite script with phonetic spellings

| Original | Phonetic Spelling | Reason |
|----------|-------------------|--------|
| EdTech | Ed Tek | Prevents "Ed-teach" pronunciation |
| LAUSD | L. A. U. S. D. | Spell out as acronym |
| PoDS-Lite | Pods Light | Natural pronunciation |
| SSO | S. S. O. | Spell out acronym |
| LTI | L. T. I. | Spell out acronym |
| OneRoster | One Roster | Add space for clarity |
| PII | P. I. I. | Spell out acronym |
| FERPA | FER-pah | Phonetic guide |
| COPPA | COP-pah | Phonetic guide |

#### VP-02: Speed Up Voiceover to 1.5X
**Problem**: Voice too slow, video drags
**Solution**: Use FFmpeg atempo filter

```bash
# Apply 1.5X speed to all voiceover files
for f in voiceover/*.wav; do
  ffmpeg -i "$f" -filter:a "atempo=1.5" -vn "${f%.wav}_fast.wav"
done
```

#### VP-03: Add Tokenized Communication Value Prop
**Problem**: Key differentiator not highlighted
**Content to add**:
- Vendors can message students/parents via tokenized relay
- Email: `TKN_STU_xxx@relay.schoolday.lausd.net`
- SMS: District-controlled, audit-logged
- Zero PII exposure in vendor systems

**Scene**: Add to Benefits or create new scene

#### VP-04: Add Integration Breadth Value Prop
**Problem**: Full platform capability not shown
**Content to add**:
- SSO (SAML, OIDC, Clever-compatible)
- Rostering (OneRoster, CSV, Ed-Fi)
- LTI 1.3 (deep linking, grade passback)
- Communication Gateway (email/SMS relay)
- API Testing Sandbox

**Scene**: Add integration icons/list

#### VP-05: Regenerate All Voiceover Files
**Dependencies**: VP-01, VP-02, VP-03, VP-04
**Process**:
1. Update SCRIPT.md with new content + phonetic spellings
2. Generate new .wav files with Coqui TTS
3. Apply 1.5X speed with FFmpeg
4. Copy to Remotion public folder

#### VP-06: Update Remotion Scenes
**Dependencies**: VP-05
**Process**:
1. Update Main.tsx with new scenes/content
2. Adjust timing to match sped-up audio
3. Add new visual elements for communication/integration
4. Preview in Remotion Studio

#### VP-07: Final Render
**Dependencies**: VP-06
**Process**:
1. Review complete video in Remotion Studio
2. Render to MP4: `npx remotion render src/index.tsx Main --output=../output/schoolday-pitch-v1.0.mp4`
3. Verify audio/video sync
4. Check file size (target: <50MB for email)

---

## Updated Script (v1.0)

### Scene 1: Hook [0:00-0:08] (sped up from 0:00-0:12)

**Phonetic Script**:
> "Six hundred seventy thousand students. One thousand schools. Hundreds of Ed Tek vendors requesting access to student data every year. Each one takes weeks to review. That's about to change."

### Scene 2: Problem [0:08-0:16]

**Phonetic Script**:
> "Right now, your privacy team is drowning. 71-question applications. Weeks of manual review per vendor. Meanwhile, vendors are paying Clever 16 to 19 dollars per school per month, and passing those costs back to you."

### Scene 3: Solution [0:16-0:28]

**Phonetic Script**:
> "SchoolDay flips the model. Vendors complete a 13-question Pods Light application and get approved in minutes. How? Tokenization. 80 percent of vendors never touch actual student P. I. I. They get secure tokens with zero privacy risk."

### Scene 4: Integration Breadth [0:28-0:40] **NEW**

**Phonetic Script**:
> "One platform, every integration type. S. S. O. with SAM-L and Open I.D. Connect. Rostering with One Roster and Ed-Fi. L. T. I. 1.3 for deep content linking. And tokenized messaging, so vendors can communicate with students and parents without ever seeing real emails or phone numbers."

### Scene 5: Benefits [0:40-0:52]

**Phonetic Script**:
> "For L. A. U. S. D., this means three things. One, 80 percent fewer manual reviews. Two, automatic compliance logging for FER-pah and COP-pah. Three, SchoolDay is your platform. No Clever fees. No middleman."

### Scene 6: Leverage [0:52-1:04]

**Phonetic Script**:
> "Vendors using SchoolDay save thousands in integration fees. They eliminate privacy liability. They get instant access instead of waiting weeks. You're giving them massive value. That means leverage."

### Scene 7: Close [1:04-1:15]

**Phonetic Script**:
> "Demand significant discounts from vendors in exchange for secure, streamlined access. SchoolDay makes it possible. Let's talk."

---

## Key Messages Summary

| Value Prop | For Superintendent | Visual |
|------------|-------------------|--------|
| **Speed** | 13 questions, 2 minutes → instant approval | Timer comparison |
| **Security** | Tokenization = zero PII exposure | Token animation |
| **Compliance** | FERPA/COPPA/CA Ed Code built-in | Compliance badges |
| **Cost** | No Clever fees ($16-19/school/month saved) | Dollar crossed out |
| **Communication** | Tokenized relay for messaging | Email/SMS icons |
| **Integration** | SSO + Rostering + LTI + API | Integration diagram |
| **Leverage** | Demand vendor discounts | Negotiation visual |

---

## Technical Setup

### Files

```
video-pitch/
├── VIDEO_PITCH_PLAN.md        # This file
├── SCRIPT.md                  # Full script with phonetic spellings
├── STORYBOARD.md              # Visual directions
├── VIDEO_PRODUCTION_GUIDE.md  # Setup instructions
├── voiceover/                 # Generated audio files
│   ├── scene1_hook.wav
│   ├── scene1_hook_fast.wav   # 1.5X speed version
│   └── ...
├── tts-env/                   # Python TTS environment
└── schoolday-pitch/           # Remotion project
    ├── src/
    │   ├── Main.tsx           # Scene compositions
    │   └── ...
    ├── public/voiceover/      # Audio for rendering
    └── output/
        └── schoolday-pitch-v1.0.mp4
```

### Commands

```bash
# Navigate to project
cd /Users/rayiskander/FerrariEdTechVendorPortal/video-pitch

# Generate voiceover with correct pronunciation
./tts-env/bin/tts --text "Six hundred seventy thousand students..." \
    --model_name tts_models/en/ljspeech/tacotron2-DDC \
    --out_path voiceover/scene1_hook.wav

# Speed up to 1.5X
ffmpeg -i voiceover/scene1_hook.wav -filter:a "atempo=1.5" voiceover/scene1_hook_fast.wav

# Copy to Remotion
cp voiceover/*_fast.wav schoolday-pitch/public/voiceover/

# Preview
cd schoolday-pitch && npm start

# Render final video
npx remotion render src/index.tsx Main --output=../output/schoolday-pitch-v1.0.mp4
```

---

## GO/NO-GO Gates

| Gate | Criteria | Test | Status |
|------|----------|------|--------|
| **PRONUNCIATION** | No garbled/mispronounced words | Audio review | 📋 Pending |
| **SPEED** | 1.5X feels natural, not rushed | Audio review | 📋 Pending |
| **CONTENT** | All 7 key messages included | Script review | 📋 Pending |
| **TIMING** | Total ≤ 90 seconds | Video playback | 📋 Pending |
| **AUDIO/VIDEO** | Perfectly synced | Video playback | 📋 Pending |
| **QUALITY** | 1080p, professional look | Export review | 📋 Pending |

---

## Timeline

| Task | Est. Time | Dependencies |
|------|-----------|--------------|
| VP-01: Fix pronunciation | 15 min | None |
| VP-02: Speed up audio | 10 min | VP-01 |
| VP-03: Add tokenized comm | 20 min | Script update |
| VP-04: Add integration breadth | 20 min | Script update |
| VP-05: Regenerate audio | 15 min | VP-01 to VP-04 |
| VP-06: Update Remotion scenes | 30 min | VP-05 |
| VP-07: Final render | 10 min | VP-06 |
| **Total** | ~2 hours | |

---

*Last updated: December 2, 2025*

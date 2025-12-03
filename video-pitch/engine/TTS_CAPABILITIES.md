# TTS Pipeline Capabilities

Advanced text-to-speech capabilities discovered during LAUSD v1.2 production.

## Overview

The Kokoro-ONNX TTS engine supports several advanced features beyond basic text-to-speech:

| Capability | Control | Impact |
|------------|---------|--------|
| **IPA Phonemes** | Exact pronunciation | Deterministic regeneration |
| **Voice Blending** | Tonal variation | Emotional nuance |
| **Speed Control** | Pacing | Urgency/gravitas |
| **Word Boundaries** | Pause placement | Natural flow |
| **Stress Marks** | Emphasis | Key word highlighting |

---

## 1. IPA Phoneme Support

### Why It Matters
- **Deterministic regeneration**: Same IPA = identical audio every time
- **Pronunciation control**: Fix mispronunciations permanently
- **Word boundary control**: Single-word compounds avoid unwanted pauses

### Usage

```python
from kokoro_onnx import Kokoro

kokoro = Kokoro("models/kokoro-v1.0.onnx", "models/voices-v1.0.bin")

# Generate from IPA phonemes (NOT text)
ipa = "skˈuːl dˈeɪ."  # "SchoolDay."
samples, sr = kokoro.create(ipa, voice="af_sarah", is_phonemes=True)
```

### Converting Text to IPA

```python
# Use the built-in phonemizer
text = "December 2024. PowerSchool breached."
ipa = kokoro.tokenizer.phonemize(text, "a")  # "a" = American English

# Result: "dᵻsˈɛmbɚ tˈuː θˈaʊzənd twˈɛnti fˈɔːɹ. pˈaʊɚ skˈuːl bɹˈiːtʃt."
```

### Word Boundary Workaround

**Problem**: TTS adds unwanted pause between "data" and "breach"

```
# BAD - space between words = pause
"dˈeɪɾə bɹˈiːtʃ"  → "data [pause] breach"

# GOOD - no space = continuous flow
"dˈeɪɾəbɹˌiːtʃ"   → "databreach" (natural compound)
```

**Solution**: Use single-word spelling for compound terms:
- "databreach" instead of "data breach"
- "onboarding" instead of "on boarding"

---

## 2. Voice Style Blending

### Why It Matters
- **Emotional variation**: Different scenes need different tones
- **Character consistency**: Blend preserves primary voice identity
- **Subtle nuance**: 70/30 blends are often better than pure voices

### Available Voices (54 total)

| Voice ID | Character | Best For |
|----------|-----------|----------|
| `af_sarah` | Professional, clear | Narration baseline |
| `af_bella` | Warm, empathetic | Problem/pain points |
| `af_heart` | Passionate, emotional | Inspiring closes |
| `af_nova` | Energetic, modern | Urgency, innovation |
| `af_sky` | Optimistic, bright | Benefits, solutions |

### Blending Syntax

```python
import numpy as np

# Load voice styles
sarah = kokoro.get_voice_style("af_sarah")
bella = kokoro.get_voice_style("af_bella")
heart = kokoro.get_voice_style("af_heart")

# Create 70/30 blend
empathetic_voice = 0.7 * sarah + 0.3 * bella

# Use blended voice
samples, sr = kokoro.create(ipa, voice=empathetic_voice, is_phonemes=True)
```

### Emotional Profiles by Scene Type

| Scene Type | Recommended Blend | Speed |
|------------|-------------------|-------|
| **Hook/Urgency** | 0.6 sarah + 0.3 nova + 0.1 heart | 1.02-1.05x |
| **Statistics** | 0.7 sarah + 0.2 bella + 0.1 heart | 0.95x |
| **Problem/Pain** | 0.5 bella + 0.3 heart + 0.2 sarah | 0.92x |
| **Solution** | 0.6 sarah + 0.3 nova + 0.1 sky | 1.0x |
| **Benefits** | 0.5 sky + 0.3 bella + 0.2 sarah | 1.0x |
| **Close/CTA** | 0.5 heart + 0.3 bella + 0.2 sarah | 0.88x |

---

## 3. Speed Control

### Why It Matters
- **Urgency**: Faster pacing for alarming statistics
- **Gravitas**: Slower pacing for emotional closes
- **Clarity**: Slightly slower for technical terms

### Usage

```python
# Speed range: 0.5x to 2.0x (1.0 = normal)
samples, sr = kokoro.create(ipa, voice="af_sarah", speed=0.95, is_phonemes=True)
```

### Recommended Speeds by Scene

| Emotion | Speed | Example |
|---------|-------|---------|
| Urgent/Alarming | 1.02-1.05x | "62 Million Student Records Exposed" |
| Professional | 0.97-1.0x | Technical integrations |
| Empathetic | 0.92-0.95x | "Your privacy team is overwhelmed" |
| Inspiring/Powerful | 0.85-0.90x | "Your students. Your data. Your sovereignty." |

---

## 4. IPA Stress Marks

### Primary Stress (ˈ)
Placed before the stressed syllable:
```
"pɹˈaɪvəsi"  → PRIvacy (stress on first syllable)
"tˌoʊkənᵻzˈeɪʃən"  → tokenizATION (stress on "za")
```

### Secondary Stress (ˌ)
Placed before syllables with secondary emphasis:
```
"ˌɔːɾəmˈæɾɪk"  → AUtoMATic (secondary on "au", primary on "mat")
```

### No Stress
Unstressed syllables have no marker:
```
"dˈeɪɾə"  → DAta (stress on first, second unstressed)
```

---

## 5. SCRIPT.yaml Schema (Extended)

The SCRIPT.yaml format now supports advanced TTS features:

```yaml
meta:
  version: v1.3.0
  voice: af_sarah                    # Base voice
  tts_engine: kokoro-onnx

scenes:
  hook:
    file: hook.wav
    duration: 9.09s
    # NEW: Advanced TTS parameters
    voice_blend:                     # Optional voice blend
      af_sarah: 0.6
      af_nova: 0.3
      af_heart: 0.1
    speed: 1.05                      # Optional speed multiplier
    phrases:
      - text: "December 2024."
        ipa: "dᵻsˈɛmbɚ tˈuː θˈaʊzənd twˈɛnti fˈɔːɹ."
      - text: "The largest K-12 databreach in history."
        ipa: "ðə lˈɑːɹdʒɪst kˈeɪ twˈɛlv dˈeɪɾəbɹˌiːtʃ ɪn hˈɪstɚɹi."

  close:
    file: close.wav
    duration: 4.65s
    voice_blend:
      af_heart: 0.5
      af_bella: 0.3
      af_sarah: 0.2
    speed: 0.88                      # Slower for gravitas
    phrases:
      - text: "SchoolDay."
        ipa: "skˈuːl dˈeɪ."
      - text: "Your sovereignty."
        ipa: "jʊɹ sˈɑːvɚɹˌɪnti."

workarounds:
  - term: "databreach"
    instead_of: "data breach"
    reason: "Single word prevents TTS pause"
    ipa_difference:
      correct: "dˈeɪɾəbɹˌiːtʃ"
      wrong: "dˈeɪɾə bɹˈiːtʃ"
```

---

## 6. Regeneration Commands

### Regenerate Single Scene

```python
import yaml
from kokoro_onnx import Kokoro

# Load SCRIPT.yaml
with open("SCRIPT.yaml") as f:
    script = yaml.safe_load(f)

kokoro = Kokoro("models/kokoro-v1.0.onnx", "models/voices-v1.0.bin")

scene = script["scenes"]["hook"]

# Get voice (blended or single)
if "voice_blend" in scene:
    voice = sum(kokoro.get_voice_style(v) * w
                for v, w in scene["voice_blend"].items())
else:
    voice = script["meta"]["voice"]

# Get speed
speed = scene.get("speed", 1.0)

# Concatenate all phrases
all_ipa = " ".join(p["ipa"] for p in scene["phrases"])

# Generate
samples, sr = kokoro.create(all_ipa, voice=voice, speed=speed, is_phonemes=True)
```

### Verify Exact Reproduction

```bash
# Generate and compare SHA256 hash
python regenerate_scene.py hook
shasum -a 256 hook.wav
# Compare against MANIFEST.sha256
```

---

## 7. Best Practices

### DO
- Store IPA phonemes in SCRIPT.yaml for deterministic regeneration
- Use word-boundary tricks (no space) for compound terms
- Document workarounds for future reference
- Use voice blending subtly (70/30 ratios)
- Slow down for emotional impact on closes

### DON'T
- Use speed > 1.1x (sounds rushed/unnatural)
- Use speed < 0.85x (sounds sluggish)
- Blend more than 3 voices (loses coherence)
- Edit generated audio files (regenerate from IPA instead)
- Trust text-to-speech for acronyms (always verify)

---

## 8. Verified Production Quality

| Video | TTS Config | Result |
|-------|------------|--------|
| **LAUSD v1.2.22** | af_sarah only, 1.0x, IPA phonemes | Production quality |
| **LAUSD v1.3** (experiment) | 5-voice blends, 0.88-1.05x | Good, but 17% longer |

---

## References

- [Kokoro-ONNX GitHub](https://github.com/thewh1teagle/kokoro-onnx)
- [IPA Chart](https://en.wikipedia.org/wiki/International_Phonetic_Alphabet)
- SCRIPT.yaml: Single source of truth for script + phonemes
- MANIFEST.sha256: Checksums for exact reproduction

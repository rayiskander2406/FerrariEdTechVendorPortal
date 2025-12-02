# Video Production Checklist

> Learnings encoded from LAUSD v1.0 → v1.2.5 production

## Pre-Production

### Script Review
- [ ] Run script through TTS preprocessor to check for pronunciation issues
  ```bash
  npx ts-node engine/tts/preprocessor.ts "Your script text here"
  ```
- [ ] Check for acronyms that need spelling out (K-12, LAUSD, SSO, API, etc.)
- [ ] Check for numbers that need phonetic treatment (62M, 500K, etc.)
- [ ] Ensure context is clear for first-time viewers (don't assume they know the district)

### Version Control
- [ ] Previous version is committed to git
- [ ] Create new version directory if major changes

## Audio Production

### Generate Voiceover
- [ ] Use consistent voice (default: `en-US-AndrewNeural`)
- [ ] Generate RAW audio (no speedup) - v1.0 lesson learned
- [ ] Name files consistently: `scene1_hook.mp3`, `scene2_problem.mp3`, etc.

### Verify Audio
- [ ] All scene files exist and are non-zero
- [ ] Listen to each file for pronunciation issues
- [ ] Check for:
  - [ ] Acronym pronunciation (should spell out)
  - [ ] Number pronunciation (should be natural)
  - [ ] No weird pauses from hyphens or special characters

### Concatenate
- [ ] Create `concat.txt` with correct file order
- [ ] Run: `ffmpeg -f concat -safe 0 -i concat.txt -c copy full_voiceover.mp3`
- [ ] Verify total duration matches expected

## Video Production

### Update Timing
- [ ] Run timing calculator:
  ```bash
  npx ts-node engine/timing/calculator.ts voiceover/ concat.txt
  ```
- [ ] Update `Main.tsx` with generated SCENES object
- [ ] Update `Root.tsx` with total duration

### Update Visuals
- [ ] Check text contrast against backgrounds (WCAG AA: 4.5:1 ratio)
- [ ] Verify animation timing matches audio cues
- [ ] Add context labels where needed (e.g., "FOR LAUSD" header)

### Render
- [ ] Run: `npx remotion render Main out/output.mp4 --codec h264`
- [ ] Verify output duration matches audio duration

## Review

### Watch Full Video
- [ ] Audio is clear and natural-sounding
- [ ] No pronunciation issues with acronyms/numbers
- [ ] Visual timing matches audio
- [ ] All text is readable (contrast check)
- [ ] Context is clear for first-time viewers
- [ ] No jarring transitions

### Technical Checks
- [ ] Video duration matches expected
- [ ] File size is reasonable (typically 6-10MB for ~100s)
- [ ] Video plays correctly in QuickTime/VLC

## Ship

### Commit
- [ ] Stage only final version (not intermediate attempts)
- [ ] Write descriptive commit message with version number
- [ ] Include changelog of what's different from previous version

### Cleanup
- [ ] Delete intermediate render files (v1.2.1, v1.2.3, etc.)
- [ ] Keep source files (scripts, audio) for future revisions

---

## Quick Reference: Common Issues

| Issue | Symptom | Fix |
|-------|---------|-----|
| Slurred acronym | "LAUSD" sounds like "LOSD" | Use "L.A.U.S.D." in script |
| Hyphen pause | "K-12" has weird break | Use "K through twelve" |
| Number sounds robotic | "500K" pronounced literally | Use "five hundred thousand" |
| Text unreadable | Low contrast on video | Check foreground/background ratio |
| Missing context | Viewer confused by numbers | Add visual/audio context |
| Audio too fast | Sounds rushed | Use RAW audio, no speedup |

## Tools

```bash
# Preprocess script for TTS
npx ts-node engine/tts/preprocessor.ts "text"

# Calculate timing from audio
npx ts-node engine/timing/calculator.ts voiceover/

# Full build pipeline
./engine/scripts/build-video.sh lausd 1.2.6
```

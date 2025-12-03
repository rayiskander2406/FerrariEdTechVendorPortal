#!/usr/bin/env python3
"""
Generate Scene Audio - LAUSD Pitch
===================================
Generates a new scene WAV file with af_sarah voice at 24kHz.

Usage:
    python generate_scene.py <scene_id> "<phrase1>" "<phrase2>" ...

Example:
    python generate_scene.py portal "One intelligent portal." "Vendors integrate themselves." "Your team reviews, not builds."

The output WAV will be saved as <scene_id>.wav in this directory.
Then add it to scenes.yaml and run build_video.py.
"""

import sys
import os
import numpy as np

# Add engine directory to path for imports
ENGINE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ENGINE_DIR)

def generate_scene(scene_id: str, phrases: list[str], pause_between: float = 0.3):
    """Generate scene audio with Kokoro af_sarah voice."""

    try:
        import kokoro_onnx
        import soundfile as sf
    except ImportError:
        print("Error: kokoro_onnx or soundfile not installed")
        print("Run: pip install kokoro-onnx soundfile")
        sys.exit(1)

    # Load Kokoro model
    models_dir = os.path.join(ENGINE_DIR, "models")
    model_path = os.path.join(models_dir, "kokoro-v1.0.onnx")
    voices_path = os.path.join(models_dir, "voices-v1.0.bin")

    if not os.path.exists(model_path):
        print(f"Error: Model not found at {model_path}")
        print("Run: cd engine && mkdir -p models && curl -L -o models/kokoro-v1.0.onnx ...")
        sys.exit(1)

    print(f"Loading Kokoro model...")
    kokoro = kokoro_onnx.Kokoro(model_path, voices_path)

    # Generate audio for each phrase
    all_audio = []
    sample_rate = None
    voice = "af_sarah"  # Female authoritative voice - MUST MATCH BASELINE

    print(f"\nGenerating {len(phrases)} phrases with voice: {voice}")

    for i, phrase in enumerate(phrases):
        print(f"  [{i+1}/{len(phrases)}] {phrase}")
        samples, sr = kokoro.create(phrase, voice=voice, speed=1.0)
        sample_rate = sr
        all_audio.append(samples)

        # Add pause between phrases (not after last)
        if i < len(phrases) - 1:
            pause_samples = int(pause_between * sr)
            all_audio.append(np.zeros(pause_samples, dtype=np.float32))

    # Concatenate
    full_audio = np.concatenate(all_audio)
    duration = len(full_audio) / sample_rate

    # Save
    output_path = os.path.join(os.path.dirname(__file__), f"{scene_id}.wav")
    sf.write(output_path, full_audio, sample_rate)

    print(f"\n✅ Saved: {scene_id}.wav ({duration:.2f}s)")
    print(f"   Sample rate: {sample_rate} Hz")
    print(f"   Voice: {voice}")
    print(f"\nNext steps:")
    print(f"  1. Add to scenes.yaml in desired position")
    print(f"  2. Run: python build_video.py --deploy")
    print(f"  3. Update Main.tsx with new SCENES constant")
    print(f"  4. Render: npx remotion render Main out/lausd-pitch-vX.X.mp4")

    return output_path

def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)

    scene_id = sys.argv[1]
    phrases = sys.argv[2:]

    print("=" * 60)
    print(f"Generating scene: {scene_id}")
    print("=" * 60)

    generate_scene(scene_id, phrases)

if __name__ == "__main__":
    main()

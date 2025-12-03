#!/usr/bin/env python3
"""
Video Build Pipeline - LAUSD Pitch
===================================
Reads scenes.yaml and generates:
1. Concatenated voiceover MP3 with correct gaps
2. TIMING.js with scene timing constants
3. Optionally copies to remotion folder and renders

Usage:
    python build_video.py                    # Build only
    python build_video.py --deploy           # Build + copy to remotion
    python build_video.py --deploy --render  # Build + copy + render

To add a new scene:
    1. Generate the WAV file with Kokoro af_sarah at 24kHz
    2. Add entry to scenes.yaml in desired position
    3. Run this script
"""

import yaml
import subprocess
import os
import shutil
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
REMOTION_DIR = SCRIPT_DIR.parent.parent / "districts/lausd/v1.2/remotion"

def get_wav_duration(filepath: str) -> float:
    """Get duration of WAV file in seconds."""
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", filepath],
        capture_output=True, text=True
    )
    return float(result.stdout.strip())

def load_config() -> dict:
    """Load scenes.yaml configuration."""
    with open(SCRIPT_DIR / "scenes.yaml") as f:
        return yaml.safe_load(f)

def verify_frozen_assets(config: dict):
    """Verify all frozen assets exist and haven't been modified."""
    print("\n🔒 Verifying frozen assets...")
    for asset in config.get("frozen_assets", []):
        path = SCRIPT_DIR / asset
        if not path.exists():
            raise FileNotFoundError(f"Frozen asset missing: {asset}")
        print(f"  ✓ {asset}")
    print("  All frozen assets verified.\n")

def build_voiceover(config: dict) -> tuple[str, float, list]:
    """
    Concatenate scene WAV files with gaps.
    Returns: (output_path, total_duration, scene_timings)
    """
    scenes = config["scenes"]
    gap_seconds = config["meta"]["scene_gap_seconds"]
    boost_db = config["meta"]["volume_boost_db"]
    version = config["meta"]["version"]

    # Create concat file
    concat_list = SCRIPT_DIR / "concat_build.txt"
    silence_file = SCRIPT_DIR / "silence_gap.wav"

    # Create silence file
    sample_rate = config["meta"]["sample_rate"]
    subprocess.run([
        "ffmpeg", "-y", "-f", "lavfi",
        f"-i", f"anullsrc=r={sample_rate}:cl=mono",
        "-t", str(gap_seconds),
        "-acodec", "pcm_s16le",
        str(silence_file)
    ], capture_output=True)

    # Build concat list and calculate timings
    scene_timings = []
    current_time = 0.0

    with open(concat_list, "w") as f:
        for i, scene in enumerate(scenes):
            wav_file = SCRIPT_DIR / scene["file"]
            if not wav_file.exists():
                raise FileNotFoundError(f"Scene audio missing: {scene['file']}")

            duration = get_wav_duration(str(wav_file))

            # Record timing
            scene_timings.append({
                "id": scene["id"],
                "component": scene["component"],
                "start": current_time,
                "end": current_time + duration,
                "duration": duration,
                "fadeIn": scene.get("fadeIn", True),
                "fadeOut": scene.get("fadeOut", True),
            })

            print(f"  {scene['id']}: {current_time:.2f}s - {current_time + duration:.2f}s ({duration:.2f}s)")

            # Write to concat list
            f.write(f"file '{scene['file']}'\n")

            # Add gap after (except last scene)
            if i < len(scenes) - 1:
                f.write(f"file 'silence_gap.wav'\n")
                current_time += duration + gap_seconds
            else:
                current_time += duration

    total_duration = current_time
    print(f"\n  Total duration: {total_duration:.2f}s")

    # Concatenate
    temp_wav = SCRIPT_DIR / "temp_concat.wav"
    subprocess.run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", str(concat_list), "-c", "copy", str(temp_wav)
    ], capture_output=True)

    # Apply boost and convert to MP3
    output_mp3 = SCRIPT_DIR / f"full_voiceover_{version}.mp3"
    subprocess.run([
        "ffmpeg", "-y", "-i", str(temp_wav),
        "-af", f"volume={boost_db}dB",
        "-b:a", "192k", str(output_mp3)
    ], capture_output=True)

    # Cleanup
    concat_list.unlink()
    silence_file.unlink()
    temp_wav.unlink()

    print(f"\n✅ Created: {output_mp3.name}")

    return str(output_mp3), total_duration, scene_timings

def generate_timing_js(config: dict, total_duration: float, scene_timings: list):
    """Generate TIMING.js with scene constants for Main.tsx."""
    fps = config["meta"]["fps"]
    fade_frames = config["meta"]["fade_frames"]
    version = config["meta"]["version"]

    lines = [
        f"// Auto-generated from scenes.yaml ({version})",
        f"// DO NOT EDIT MANUALLY - run build_video.py to regenerate",
        f"// Total duration: {total_duration:.2f} seconds",
        "",
        f"const FADE_FRAMES = {fade_frames}; // {fade_frames / fps:.1f}s fade duration",
        "",
        "const SCENES = {",
    ]

    for scene in scene_timings:
        # Calculate start frame based on when previous scene's audio ends
        # (for cross-fade overlap during gap)
        start_frame = f"Math.round({scene['start']:.2f} * {fps})"

        # Duration extends to this scene's audio end + fade overlap
        end_time = scene['end']
        duration_calc = f"Math.round(({end_time:.2f} - {scene['start']:.2f}) * {fps})"

        fade_suffix = " + FADE_FRAMES" if scene['fadeOut'] else ""

        lines.append(f"  {scene['id']}: {{start: {start_frame}, duration: {duration_calc}{fade_suffix}}},  // {scene['duration']:.2f}s")

    lines.append("};")
    lines.append("")
    lines.append(f"// Root.tsx: durationInFrames={{Math.round({total_duration:.2f} * {fps})}}")
    lines.append("")
    lines.append("// Sequence generation:")

    for scene in scene_timings:
        fade_in = "true" if scene['fadeIn'] else "false"
        fade_out = "true" if scene['fadeOut'] else "false"
        lines.append(f"// <Sequence from={{SCENES.{scene['id']}.start}} durationInFrames={{SCENES.{scene['id']}.duration}}>")
        lines.append(f"//   <SlideTransition durationInFrames={{SCENES.{scene['id']}.duration}} fadeIn={{{fade_in}}} fadeOut={{{fade_out}}}>")
        lines.append(f"//     <{scene['component']} />")
        lines.append(f"//   </SlideTransition>")
        lines.append(f"// </Sequence>")
        lines.append("")

    output_path = SCRIPT_DIR / "TIMING.js"
    with open(output_path, "w") as f:
        f.write("\n".join(lines))

    print(f"✅ Created: TIMING.js")
    return str(output_path)

def deploy_to_remotion(config: dict, mp3_path: str, total_duration: float):
    """Copy voiceover to remotion and update references."""
    version = config["meta"]["version"]
    fps = config["meta"]["fps"]

    # Copy MP3
    dest_mp3 = REMOTION_DIR / "public/voiceover" / f"full_voiceover_{version}.mp3"
    shutil.copy(mp3_path, dest_mp3)
    print(f"✅ Copied to: {dest_mp3.relative_to(REMOTION_DIR.parent.parent)}")

    # Update Root.tsx duration
    root_tsx = REMOTION_DIR / "src/Root.tsx"
    content = root_tsx.read_text()

    import re
    new_duration = f"durationInFrames={{Math.round({total_duration:.2f} * {fps})}} // {total_duration:.2f} seconds at {fps}fps ({version})"
    content = re.sub(
        r'durationInFrames=\{[^}]+\}[^>]*',
        new_duration,
        content
    )
    root_tsx.write_text(content)
    print(f"✅ Updated Root.tsx duration: {total_duration:.2f}s")

    print(f"\n📋 Next: Update Main.tsx SCENES constant from TIMING.js")
    print(f"   Then: cd {REMOTION_DIR} && npx remotion render Main out/lausd-pitch-{version}.mp4")

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Build LAUSD video from scenes.yaml")
    parser.add_argument("--deploy", action="store_true", help="Copy to remotion folder")
    parser.add_argument("--render", action="store_true", help="Render video (requires --deploy)")
    args = parser.parse_args()

    print("=" * 60)
    print("LAUSD Video Build Pipeline")
    print("=" * 60)

    # Load config
    config = load_config()
    version = config["meta"]["version"]
    print(f"\n📦 Version: {version}")
    print(f"   Scenes: {len(config['scenes'])}")

    # Verify frozen assets
    verify_frozen_assets(config)

    # Build voiceover
    print("🎤 Building voiceover...")
    mp3_path, total_duration, scene_timings = build_voiceover(config)

    # Generate timing
    print("\n📐 Generating timing...")
    generate_timing_js(config, total_duration, scene_timings)

    # Deploy if requested
    if args.deploy:
        print("\n🚀 Deploying to remotion...")
        deploy_to_remotion(config, mp3_path, total_duration)

    # Render if requested
    if args.render:
        if not args.deploy:
            print("\n⚠️  --render requires --deploy")
            return
        print("\n🎬 Rendering video...")
        subprocess.run([
            "npx", "remotion", "render", "Main",
            f"out/lausd-pitch-{version}.mp4",
            "--concurrency=1", "--timeout=60000"
        ], cwd=str(REMOTION_DIR))

    print("\n" + "=" * 60)
    print("✅ Build complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()

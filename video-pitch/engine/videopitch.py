#!/usr/bin/env python3
"""
Video Pitch Pipeline - Core Engine

This module provides the core functionality for the video pitch production pipeline.
Used by the /video-pitch slash command.

Usage:
    from videopitch import VideoPitchEngine

    engine = VideoPitchEngine(district="lausd", version="v1.0.0")
    engine.validate_script(script_text)
    engine.select_voice(scene="hook", voices=["af_sarah", "af_nova"])
    engine.generate_audio()
    engine.create_storyboard()
    engine.render()
"""

import os
import re
import json
import yaml
import hashlib
import subprocess
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

# Kokoro TTS integration
try:
    from kokoro_onnx import Kokoro
    KOKORO_AVAILABLE = True
except ImportError:
    KOKORO_AVAILABLE = False
    print("Warning: kokoro_onnx not available. TTS features disabled.")

import numpy as np
import soundfile as sf


@dataclass
class ScriptIssue:
    """Represents a potential issue in the script."""
    issue_type: str  # acronym, compound, number, brand
    found: str
    suggestion: str
    action: str  # auto, choose, confirm
    ipa_correct: Optional[str] = None
    ipa_wrong: Optional[str] = None


@dataclass
class Scene:
    """Represents a scene in the video."""
    id: str
    text: str
    ipa: Optional[str] = None
    duration: Optional[float] = None
    voice: Optional[str] = None
    speed: float = 1.0
    workarounds: List[Dict] = field(default_factory=list)


@dataclass
class VoiceConfig:
    """Voice configuration for a scene."""
    voice: str  # Voice name or blend expression
    speed: float = 1.0
    blend: Optional[Dict[str, float]] = None  # e.g., {"af_sarah": 0.7, "af_bella": 0.3}


class ScriptValidator:
    """Validates and analyzes scripts for TTS issues."""

    # Common acronyms in EdTech
    ACRONYMS = {
        "LAUSD": ("lˈɔːzd", "Pronounce as 'LAWZD'"),
        "SFUSD": ("ɛs ɛf juː ɛs dˈiː", "Spell out 'S.F.U.S.D.'"),
        "NYCDOE": ("ɛn waɪ siː diː oʊ ˈiː", "Spell out"),
        "SSO": ("ɛs ɛs ˈoʊ", "Spell out 'S.S.O.'"),
        "LTI": ("ɛl tiː ˈaɪ", "Spell out 'L.T.I.'"),
        "SAML": ("sˈæməl", "Pronounce as 'SAM-ul'"),
        "FERPA": ("fˈɜːpə", "Pronounce as 'FUR-pah'"),
        "COPPA": ("kˈɑːpə", "Pronounce as 'COP-ah'"),
        "API": ("ˌeɪ piː ˈaɪ", "Spell out 'A.P.I.'"),
        "PII": ("piː aɪ ˈaɪ", "Spell out 'P.I.I.'"),
    }

    # Compound terms that cause pause issues
    COMPOUNDS = {
        "data breach": ("databreach", "dˈeɪɾəbɹˌiːtʃ"),
        "on boarding": ("onboarding", "ˈɑːnbˌɔːɹdɪŋ"),
        "sign on": ("signon", "sˈaɪnˌɑːn"),
    }

    # Brand names with specific pronunciations
    BRANDS = {
        "PowerSchool": "pˈaʊɚ skˈuːl",
        "SchoolDay": "skˈuːl dˈeɪ",
        "Clever": "klˈɛvɚ",
        "OneRoster": "wˈʌn ɹˈɑːstɚ",
        "Ed-Fi": "ˈɛdfˌaɪ",
        "OpenID": "ˈoʊpən aɪdˈiː",
    }

    def __init__(self, kokoro: Optional['Kokoro'] = None):
        self.kokoro = kokoro

    def analyze(self, text: str) -> List[ScriptIssue]:
        """Analyze script text for potential TTS issues."""
        issues = []

        # Check acronyms
        for acronym, (ipa, suggestion) in self.ACRONYMS.items():
            if acronym in text:
                issues.append(ScriptIssue(
                    issue_type="acronym",
                    found=acronym,
                    suggestion=suggestion,
                    action="choose",
                    ipa_correct=ipa
                ))

        # Check compound terms
        for compound, (replacement, ipa) in self.COMPOUNDS.items():
            if compound.lower() in text.lower():
                issues.append(ScriptIssue(
                    issue_type="compound",
                    found=compound,
                    suggestion=f"Use '{replacement}' (no pause)",
                    action="confirm",
                    ipa_correct=ipa
                ))

        # Check numbers
        number_patterns = [
            (r'\$(\d+)', 'currency'),
            (r'(\d+)\s*million', 'large_number'),
            (r'(\d+)\s*%', 'percentage'),
            (r'(\d{1,3}(?:,\d{3})+)', 'formatted_number'),
        ]
        for pattern, num_type in number_patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                issues.append(ScriptIssue(
                    issue_type="number",
                    found=match.group(0),
                    suggestion=f"Will be spoken naturally ({num_type})",
                    action="auto"
                ))

        # Check brand names
        for brand, ipa in self.BRANDS.items():
            if brand in text:
                issues.append(ScriptIssue(
                    issue_type="brand",
                    found=brand,
                    suggestion=f"Standard pronunciation",
                    action="confirm",
                    ipa_correct=ipa
                ))

        return issues

    def phonemize(self, text: str, lang: str = "a") -> str:
        """Convert text to IPA phonemes."""
        if self.kokoro:
            return self.kokoro.tokenizer.phonemize(text, lang)
        return f"[IPA not available: {text}]"


class AudioGenerator:
    """Generates audio using Kokoro TTS."""

    VOICES = {
        "af_sarah": "Professional, clear - general narration",
        "af_bella": "Warm, empathetic - problem/pain scenes",
        "af_heart": "Passionate, emotional - inspiring closes",
        "af_nova": "Energetic, modern - urgency, innovation",
        "af_sky": "Optimistic, bright - benefits, solutions",
        "am_adam": "Male, authoritative - executive content",
        "am_michael": "Male, conversational - friendly narration",
    }

    def __init__(self, models_dir: str = "models"):
        self.models_dir = Path(models_dir)
        self.kokoro = None
        self.voice_styles = {}
        self._load_kokoro()

    def _load_kokoro(self):
        """Load Kokoro TTS model."""
        if not KOKORO_AVAILABLE:
            return

        model_path = self.models_dir / "kokoro-v1.0.onnx"
        voices_path = self.models_dir / "voices-v1.0.bin"

        if model_path.exists() and voices_path.exists():
            self.kokoro = Kokoro(str(model_path), str(voices_path))
            # Pre-load voice styles
            for voice in self.VOICES:
                try:
                    self.voice_styles[voice] = self.kokoro.get_voice_style(voice)
                except:
                    pass

    def get_voice(self, voice_config: VoiceConfig) -> np.ndarray:
        """Get voice style array, potentially blended."""
        if voice_config.blend:
            # Blend multiple voices
            blended = None
            for voice_name, weight in voice_config.blend.items():
                style = self.voice_styles.get(voice_name)
                if style is not None:
                    if blended is None:
                        blended = weight * style
                    else:
                        blended += weight * style
            return blended
        else:
            return self.voice_styles.get(voice_config.voice, voice_config.voice)

    def generate(
        self,
        text: str,
        voice_config: VoiceConfig,
        is_phonemes: bool = False,
        output_path: Optional[str] = None
    ) -> Tuple[np.ndarray, int]:
        """Generate audio from text or IPA phonemes."""
        if not self.kokoro:
            raise RuntimeError("Kokoro TTS not loaded")

        voice = self.get_voice(voice_config)

        samples, sr = self.kokoro.create(
            text,
            voice=voice,
            speed=voice_config.speed,
            is_phonemes=is_phonemes
        )

        if output_path:
            sf.write(output_path, samples, sr)

        return samples, sr

    def generate_samples(
        self,
        text: str,
        voices: List[str],
        speeds: List[float] = [1.0],
        output_dir: str = "voice_samples"
    ) -> Dict[str, str]:
        """Generate multiple voice samples for A/B testing."""
        os.makedirs(output_dir, exist_ok=True)
        samples = {}

        for voice in voices:
            for speed in speeds:
                config = VoiceConfig(voice=voice, speed=speed)
                filename = f"{voice}_speed{speed}.wav"
                output_path = os.path.join(output_dir, filename)

                self.generate(text, config, output_path=output_path)
                samples[f"{voice}@{speed}x"] = output_path

        return samples


class VideoPitchEngine:
    """Main engine for video pitch production."""

    def __init__(
        self,
        district: str,
        version: str = "v1.0.0",
        base_dir: str = None
    ):
        self.district = district
        self.version = version

        if base_dir is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))

        self.base_dir = Path(base_dir)
        self.project_dir = self.base_dir / f"{district}_{version.replace('.', '_')}"
        self.project_dir.mkdir(exist_ok=True)

        # Initialize components
        self.audio_gen = AudioGenerator(self.base_dir / "models")
        self.validator = ScriptValidator(self.audio_gen.kokoro)

        # State
        self.scenes: List[Scene] = []
        self.voice_configs: Dict[str, VoiceConfig] = {}
        self.timing: Dict = {}
        self.storyboard: Dict = {}

    def validate_script(self, script_text: str) -> List[ScriptIssue]:
        """Validate script and return issues."""
        return self.validator.analyze(script_text)

    def parse_script(self, script_text: str, scene_markers: str = "---") -> List[Scene]:
        """Parse script text into scenes."""
        scenes = []
        parts = script_text.split(scene_markers)

        for i, part in enumerate(parts):
            part = part.strip()
            if not part:
                continue

            # Try to extract scene ID from first line
            lines = part.split('\n')
            first_line = lines[0].strip()

            if first_line.startswith('#') or first_line.endswith(':'):
                scene_id = re.sub(r'[^a-zA-Z0-9]', '', first_line.lower())
                text = '\n'.join(lines[1:]).strip()
            else:
                scene_id = f"scene{i+1}"
                text = part

            # Generate IPA
            ipa = self.validator.phonemize(text) if self.audio_gen.kokoro else None

            scenes.append(Scene(id=scene_id, text=text, ipa=ipa))

        self.scenes = scenes
        return scenes

    def save_script_yaml(self) -> str:
        """Save script to YAML format."""
        data = {
            "meta": {
                "district": self.district,
                "version": self.version,
                "created": datetime.now().isoformat(),
                "tts_engine": "kokoro-onnx",
            },
            "scenes": {}
        }

        for scene in self.scenes:
            data["scenes"][scene.id] = {
                "text": scene.text,
                "ipa": scene.ipa,
                "duration": scene.duration,
                "workarounds": scene.workarounds,
            }

        output_path = self.project_dir / "SCRIPT.yaml"
        with open(output_path, 'w') as f:
            yaml.dump(data, f, default_flow_style=False, allow_unicode=True)

        return str(output_path)

    def generate_voice_samples(
        self,
        scene_id: str,
        voices: List[str],
        speeds: List[float] = [0.95, 1.0, 1.05]
    ) -> Dict[str, str]:
        """Generate voice samples for a scene."""
        scene = next((s for s in self.scenes if s.id == scene_id), None)
        if not scene:
            raise ValueError(f"Scene '{scene_id}' not found")

        output_dir = self.project_dir / "voice_samples"
        return self.audio_gen.generate_samples(
            scene.ipa or scene.text,
            voices,
            speeds,
            str(output_dir)
        )

    def set_voice_config(self, scene_id: str, config: VoiceConfig):
        """Set voice configuration for a scene."""
        self.voice_configs[scene_id] = config

    def generate_audio(self) -> Dict[str, str]:
        """Generate audio for all scenes."""
        outputs = {}

        for scene in self.scenes:
            config = self.voice_configs.get(
                scene.id,
                VoiceConfig(voice="af_sarah")
            )

            output_path = self.project_dir / f"{scene.id}.wav"

            samples, sr = self.audio_gen.generate(
                scene.ipa or scene.text,
                config,
                is_phonemes=bool(scene.ipa),
                output_path=str(output_path)
            )

            # Store duration
            scene.duration = len(samples) / sr
            outputs[scene.id] = str(output_path)

        return outputs

    def concatenate_audio(self, gap_seconds: float = 0.8) -> str:
        """Concatenate all scene audio with gaps."""
        # Create silence file
        sr = 24000  # Kokoro sample rate
        silence = np.zeros(int(gap_seconds * sr))
        silence_path = self.project_dir / "silence.wav"
        sf.write(str(silence_path), silence, sr)

        # Create concat list
        concat_list = self.project_dir / "concat_list.txt"
        with open(concat_list, 'w') as f:
            for i, scene in enumerate(self.scenes):
                f.write(f"file '{scene.id}.wav'\n")
                if i < len(self.scenes) - 1:
                    f.write(f"file 'silence.wav'\n")

        # Concatenate
        output_wav = self.project_dir / "full_voiceover.wav"
        output_mp3 = self.project_dir / "full_voiceover.mp3"

        subprocess.run([
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", str(concat_list), "-c", "copy", str(output_wav)
        ], capture_output=True)

        subprocess.run([
            "ffmpeg", "-y", "-i", str(output_wav),
            "-codec:a", "libmp3lame", "-qscale:a", "2", str(output_mp3)
        ], capture_output=True)

        return str(output_mp3)

    def generate_timing(self, fps: int = 30, gap_seconds: float = 0.8) -> Dict:
        """Generate timing data for Remotion."""
        timing = {
            "fps": fps,
            "gap_seconds": gap_seconds,
            "scenes": [],
            "total_duration": 0
        }

        current_frame = 0
        for scene in self.scenes:
            duration_frames = int(scene.duration * fps)
            gap_frames = int(gap_seconds * fps)

            timing["scenes"].append({
                "id": scene.id,
                "start_frame": current_frame,
                "duration_frames": duration_frames,
                "duration_seconds": scene.duration,
            })

            current_frame += duration_frames + gap_frames

        # Remove last gap
        timing["total_duration"] = (current_frame - int(gap_seconds * fps)) / fps

        # Save
        output_path = self.project_dir / "TIMING.json"
        with open(output_path, 'w') as f:
            json.dump(timing, f, indent=2)

        self.timing = timing
        return timing

    def generate_manifest(self) -> str:
        """Generate SHA256 manifest of all assets."""
        manifest_lines = [
            f"# {self.district} {self.version} - SHA256 Checksums",
            f"# Generated: {datetime.now().isoformat()}",
            ""
        ]

        for file in sorted(self.project_dir.glob("*")):
            if file.is_file() and file.suffix in ['.wav', '.mp3', '.yaml', '.json']:
                sha256 = hashlib.sha256(file.read_bytes()).hexdigest()
                manifest_lines.append(f"{sha256}  {file.name}")

        output_path = self.project_dir / "MANIFEST.sha256"
        output_path.write_text('\n'.join(manifest_lines))

        return str(output_path)

    def summary(self) -> str:
        """Generate production summary."""
        total_duration = sum(s.duration or 0 for s in self.scenes)

        return f"""
Video Production Complete

District: {self.district}
Version: {self.version}
Scenes: {len(self.scenes)}
Duration: {total_duration:.2f}s
Output: {self.project_dir}

Files created:
- SCRIPT.yaml
- TIMING.json
- MANIFEST.sha256
- {len(self.scenes)} scene WAV files
- full_voiceover.mp3
"""


# CLI interface
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python videopitch.py <command> [args]")
        print("\nCommands:")
        print("  validate <script.txt>    - Validate script for TTS issues")
        print("  phonemize <text>         - Convert text to IPA")
        print("  voices                   - List available voices")
        sys.exit(1)

    command = sys.argv[1]

    if command == "voices":
        print("\nAvailable Voices:")
        for voice, desc in AudioGenerator.VOICES.items():
            print(f"  {voice}: {desc}")

    elif command == "validate":
        if len(sys.argv) < 3:
            print("Usage: python videopitch.py validate <script.txt>")
            sys.exit(1)

        with open(sys.argv[2]) as f:
            text = f.read()

        validator = ScriptValidator()
        issues = validator.analyze(text)

        print("\nScript Analysis:")
        print("-" * 60)
        for issue in issues:
            print(f"[{issue.issue_type.upper()}] {issue.found}")
            print(f"  Suggestion: {issue.suggestion}")
            print(f"  Action: {issue.action}")
            print()

    elif command == "phonemize":
        if len(sys.argv) < 3:
            print("Usage: python videopitch.py phonemize '<text>'")
            sys.exit(1)

        text = ' '.join(sys.argv[2:])

        try:
            from kokoro_onnx import Kokoro
            kokoro = Kokoro("models/kokoro-v1.0.onnx", "models/voices-v1.0.bin")
            ipa = kokoro.tokenizer.phonemize(text, "a")
            print(f"\nText: {text}")
            print(f"IPA:  {ipa}")
        except Exception as e:
            print(f"Error: {e}")
            print("Make sure Kokoro models are in ./models/")

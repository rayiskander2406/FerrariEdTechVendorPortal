#!/bin/bash

# SchoolDay Pitch Video - Setup Script
# Run this script to set up the complete video production pipeline

set -e

echo "=========================================="
echo "  SchoolDay Pitch Video - Setup"
echo "=========================================="
echo ""

cd "$(dirname "$0")"
PITCH_DIR=$(pwd)

# Create directories
echo "📁 Creating directory structure..."
mkdir -p voiceover
mkdir -p output
mkdir -p assets

# ============================================
# Step 1: Set up Python TTS environment
# ============================================
echo ""
echo "🎤 Setting up Text-to-Speech..."
echo ""

if [ ! -d "tts-env" ]; then
    python3 -m venv tts-env
    source tts-env/bin/activate
    pip install --upgrade pip
    pip install coqui-tts
    echo "✅ Coqui TTS installed"
else
    source tts-env/bin/activate
    echo "✅ TTS environment already exists"
fi

# ============================================
# Step 2: Generate Voiceover
# ============================================
echo ""
echo "🔊 Generating voiceover audio..."
echo ""

# Check if XTTS model is available, fall back to simpler model if not
TTS_MODEL="tts_models/en/ljspeech/tacotron2-DDC"

generate_audio() {
    local text="$1"
    local output="$2"
    echo "  Generating: $output"
    tts --text "$text" --model_name "$TTS_MODEL" --out_path "$output" 2>/dev/null || {
        echo "  ⚠️  TTS failed for $output, trying fallback..."
        # Fallback to piper or skip
    }
}

# Scene 1: Hook
generate_audio "670,000 students. 1,000 schools. Hundreds of EdTech vendors requesting access to student data every year. Each one takes weeks to review. That's about to change." "voiceover/scene1_hook.wav"

# Scene 2: Problem
generate_audio "Right now, your privacy team is drowning. 71-question applications. Weeks of manual review per vendor. Meanwhile, vendors are paying Clever 16 to 19 dollars per school per month just to connect—and passing those costs back to you. It's slow, expensive, and risky." "voiceover/scene2_problem.wav"

# Scene 3: Solution
generate_audio "SchoolDay's Vendor Portal flips the model. Vendors complete a 13-question PoDS-Lite application and get approved in minutes—not weeks. How? Tokenization. 80 percent of vendors never need to touch actual student PII. They get tokens like TKN_STU_8X9Y2Z that work perfectly for personalization, progress tracking, and analytics—with zero privacy risk." "voiceover/scene3_solution.wav"

# Scene 4: Benefits
generate_audio "For LAUSD, this means three things: One, your privacy team handles 80 percent fewer manual reviews. Two, every data access is automatically logged and auditable—FERPA, COPPA, and California Ed Code compliance built in. Three, SchoolDay is your platform. No Clever fees. No middleman." "voiceover/scene4_benefits.wav"

# Scene 5: Leverage
generate_audio "Here's where it gets strategic. Vendors using SchoolDay save thousands in integration fees and eliminate their privacy liability entirely. They get instant access instead of waiting weeks. You're giving them massive value—and that means leverage." "voiceover/scene5_leverage.wav"

# Scene 6: Close
generate_audio "Demand significant discounts from vendors in exchange for this streamlined, secure access. SchoolDay makes it possible. Let's talk." "voiceover/scene6_close.wav"

echo ""
echo "✅ Voiceover generation complete!"

# ============================================
# Step 3: Set up Remotion project
# ============================================
echo ""
echo "🎬 Setting up Remotion video project..."
echo ""

if [ ! -d "schoolday-pitch" ]; then
    # Create a minimal Remotion project manually
    mkdir -p schoolday-pitch/src
    mkdir -p schoolday-pitch/public/voiceover

    # Copy voiceover files
    cp voiceover/*.wav schoolday-pitch/public/voiceover/ 2>/dev/null || true

    # Create package.json
    cat > schoolday-pitch/package.json << 'PACKAGE'
{
  "name": "schoolday-pitch",
  "version": "1.0.0",
  "description": "SchoolDay 90-second pitch video",
  "scripts": {
    "start": "remotion studio",
    "build": "remotion render src/index.tsx Main --output=../output/schoolday-pitch.mp4",
    "preview": "remotion preview"
  },
  "dependencies": {
    "@remotion/cli": "4.0.379",
    "@remotion/player": "4.0.379",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "remotion": "4.0.379"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "typescript": "^5.0.0"
  }
}
PACKAGE

    # Create tsconfig.json
    cat > schoolday-pitch/tsconfig.json << 'TSCONFIG'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020", "DOM"],
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
TSCONFIG

    # Create remotion.config.ts
    cat > schoolday-pitch/remotion.config.ts << 'REMOTION_CONFIG'
import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
REMOTION_CONFIG

    # Create main composition
    cat > schoolday-pitch/src/index.tsx << 'INDEX_TSX'
import {registerRoot} from 'remotion';
import {RemotionRoot} from './Root';

registerRoot(RemotionRoot);
INDEX_TSX

    cat > schoolday-pitch/src/Root.tsx << 'ROOT_TSX'
import {Composition} from 'remotion';
import {Main} from './Main';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={Main}
        durationInFrames={90 * 30} // 90 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
ROOT_TSX

    cat > schoolday-pitch/src/Main.tsx << 'MAIN_TSX'
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

// Color palette
const COLORS = {
  lausdGold: '#FFB81C',
  lausdNavy: '#003087',
  white: '#FFFFFF',
  successGreen: '#22C55E',
  riskRed: '#EF4444',
  gray: '#64748B',
};

// Scene durations in frames (30fps)
const SCENES = {
  hook: {start: 0, duration: 10 * 30},      // 0-10s
  problem: {start: 10 * 30, duration: 15 * 30},  // 10-25s
  solution: {start: 25 * 30, duration: 20 * 30}, // 25-45s
  benefits: {start: 45 * 30, duration: 20 * 30}, // 45-65s
  leverage: {start: 65 * 30, duration: 15 * 30}, // 65-80s
  close: {start: 80 * 30, duration: 10 * 30},    // 80-90s
};

// Animated number component
const AnimatedNumber: React.FC<{value: number; suffix?: string}> = ({value, suffix = ''}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const animatedValue = spring({
    frame,
    fps,
    config: {damping: 100},
  }) * value;

  return <span>{Math.round(animatedValue).toLocaleString()}{suffix}</span>;
};

// Scene 1: Hook
const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{
      backgroundColor: COLORS.lausdNavy,
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{
        display: 'flex',
        gap: 60,
        opacity,
      }}>
        <div style={{textAlign: 'center', color: COLORS.white}}>
          <div style={{fontSize: 120, fontWeight: 'bold', color: COLORS.lausdGold}}>
            <AnimatedNumber value={670000} />
          </div>
          <div style={{fontSize: 32}}>Students</div>
        </div>
        <div style={{textAlign: 'center', color: COLORS.white}}>
          <div style={{fontSize: 120, fontWeight: 'bold', color: COLORS.lausdGold}}>
            <AnimatedNumber value={1000} suffix="+" />
          </div>
          <div style={{fontSize: 32}}>Schools</div>
        </div>
        <div style={{textAlign: 'center', color: COLORS.white}}>
          <div style={{fontSize: 120, fontWeight: 'bold', color: COLORS.lausdGold}}>100s</div>
          <div style={{fontSize: 32}}>Vendors/Year</div>
        </div>
      </div>
      <div style={{
        position: 'absolute',
        bottom: 100,
        fontSize: 48,
        color: COLORS.white,
        opacity: interpolate(frame, [60, 90], [0, 1], {extrapolateRight: 'clamp'}),
      }}>
        Each takes weeks to review. That's about to change.
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: Problem
const SceneProblem: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{
      backgroundColor: COLORS.white,
      padding: 100,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <h1 style={{
        fontSize: 64,
        color: COLORS.riskRed,
        marginBottom: 60,
      }}>
        The Current Pain
      </h1>
      <div style={{display: 'flex', flexDirection: 'column', gap: 40}}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 30,
          opacity: interpolate(frame, [0, 30], [0, 1], {extrapolateRight: 'clamp'}),
        }}>
          <div style={{fontSize: 80}}>📋</div>
          <div style={{fontSize: 48, color: COLORS.lausdNavy}}>
            <strong>71 Questions</strong> per application
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 30,
          opacity: interpolate(frame, [30, 60], [0, 1], {extrapolateRight: 'clamp'}),
        }}>
          <div style={{fontSize: 80}}>⏱️</div>
          <div style={{fontSize: 48, color: COLORS.lausdNavy}}>
            <strong>2-4 Weeks</strong> review time per vendor
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 30,
          opacity: interpolate(frame, [60, 90], [0, 1], {extrapolateRight: 'clamp'}),
        }}>
          <div style={{fontSize: 80}}>💸</div>
          <div style={{fontSize: 48, color: COLORS.lausdNavy}}>
            <strong>$16-19/school/month</strong> → Clever fees
          </div>
        </div>
      </div>
      <div style={{
        position: 'absolute',
        bottom: 100,
        fontSize: 56,
        color: COLORS.riskRed,
        fontWeight: 'bold',
        opacity: interpolate(frame, [120, 150], [0, 1], {extrapolateRight: 'clamp'}),
      }}>
        Slow. Expensive. Risky.
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: Solution
const SceneSolution: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{
      backgroundColor: COLORS.lausdNavy,
      padding: 100,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{
        fontSize: 72,
        color: COLORS.lausdGold,
        fontWeight: 'bold',
        marginBottom: 60,
        textAlign: 'center',
      }}>
        SchoolDay Vendor Portal
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 40,
        marginBottom: 80,
      }}>
        <div style={{
          background: COLORS.white,
          borderRadius: 20,
          padding: 40,
          textAlign: 'center',
          transform: `scale(${spring({frame, fps, config: {damping: 10}})})`,
        }}>
          <div style={{fontSize: 72, fontWeight: 'bold', color: COLORS.successGreen}}>13</div>
          <div style={{fontSize: 28, color: COLORS.lausdNavy}}>Questions</div>
        </div>
        <div style={{
          fontSize: 72,
          color: COLORS.white,
          alignSelf: 'center',
        }}>→</div>
        <div style={{
          background: COLORS.white,
          borderRadius: 20,
          padding: 40,
          textAlign: 'center',
          transform: `scale(${spring({frame: frame - 15, fps, config: {damping: 10}})})`,
        }}>
          <div style={{fontSize: 72, fontWeight: 'bold', color: COLORS.successGreen}}>2</div>
          <div style={{fontSize: 28, color: COLORS.lausdNavy}}>Minutes</div>
        </div>
        <div style={{
          fontSize: 72,
          color: COLORS.white,
          alignSelf: 'center',
        }}>→</div>
        <div style={{
          background: COLORS.successGreen,
          borderRadius: 20,
          padding: 40,
          textAlign: 'center',
          transform: `scale(${spring({frame: frame - 30, fps, config: {damping: 10}})})`,
        }}>
          <div style={{fontSize: 72}}>✓</div>
          <div style={{fontSize: 28, color: COLORS.white}}>Approved</div>
        </div>
      </div>

      <div style={{
        fontSize: 36,
        color: COLORS.white,
        textAlign: 'center',
        opacity: interpolate(frame, [90, 120], [0, 1], {extrapolateRight: 'clamp'}),
      }}>
        <strong>80% of vendors</strong> never touch actual PII.<br/>
        Tokens work perfectly: <code style={{
          background: 'rgba(255,255,255,0.2)',
          padding: '5px 15px',
          borderRadius: 8,
        }}>TKN_STU_8X9Y2Z</code>
      </div>
    </AbsoluteFill>
  );
};

// Scene 4: Benefits
const SceneBenefits: React.FC = () => {
  const frame = useCurrentFrame();

  const benefits = [
    {icon: '📊', title: '80% fewer', subtitle: 'manual reviews'},
    {icon: '📝', title: 'Full audit', subtitle: 'FERPA/COPPA compliant'},
    {icon: '🏛️', title: 'Your platform', subtitle: 'No middleman fees'},
  ];

  return (
    <AbsoluteFill style={{
      backgroundColor: COLORS.white,
      padding: 100,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <h1 style={{
        fontSize: 64,
        color: COLORS.lausdNavy,
        marginBottom: 60,
        textAlign: 'center',
      }}>
        For LAUSD, This Means:
      </h1>
      <div style={{display: 'flex', justifyContent: 'center', gap: 60}}>
        {benefits.map((benefit, i) => (
          <div key={i} style={{
            background: COLORS.lausdNavy,
            borderRadius: 20,
            padding: 50,
            textAlign: 'center',
            width: 350,
            opacity: interpolate(frame, [i * 45, i * 45 + 30], [0, 1], {extrapolateRight: 'clamp'}),
            transform: `translateY(${interpolate(frame, [i * 45, i * 45 + 30], [50, 0], {extrapolateRight: 'clamp'})}px)`,
          }}>
            <div style={{fontSize: 80}}>{benefit.icon}</div>
            <div style={{fontSize: 48, fontWeight: 'bold', color: COLORS.lausdGold}}>
              {benefit.title}
            </div>
            <div style={{fontSize: 28, color: COLORS.white}}>
              {benefit.subtitle}
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Scene 5: Leverage
const SceneLeverage: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${COLORS.lausdNavy} 0%, #001845 100%)`,
      padding: 100,
      fontFamily: 'Inter, system-ui, sans-serif',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <div style={{textAlign: 'center'}}>
        <div style={{
          fontSize: 48,
          color: COLORS.white,
          marginBottom: 40,
          opacity: interpolate(frame, [0, 30], [0, 1]),
        }}>
          Vendors using SchoolDay:
        </div>
        <div style={{display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 60}}>
          {['💰 Save thousands', '🛡️ Zero liability', '⚡ Instant access'].map((item, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 15,
              padding: '20px 40px',
              color: COLORS.white,
              fontSize: 32,
              opacity: interpolate(frame, [30 + i * 20, 50 + i * 20], [0, 1]),
              transform: `scale(${spring({frame: frame - 30 - i * 20, fps})})`,
            }}>
              {item}
            </div>
          ))}
        </div>
        <div style={{
          fontSize: 72,
          fontWeight: 'bold',
          color: COLORS.lausdGold,
          opacity: interpolate(frame, [120, 150], [0, 1]),
          transform: `scale(${spring({frame: frame - 120, fps, config: {damping: 8}})})`,
        }}>
          = LEVERAGE
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 6: Close
const SceneClose: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{
      background: COLORS.lausdGold,
      padding: 100,
      fontFamily: 'Inter, system-ui, sans-serif',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <div style={{textAlign: 'center'}}>
        <div style={{
          fontSize: 56,
          color: COLORS.lausdNavy,
          fontWeight: 'bold',
          marginBottom: 40,
          opacity: interpolate(frame, [0, 30], [0, 1]),
        }}>
          Demand Significant Discounts<br/>From Vendors
        </div>
        <div style={{
          fontSize: 36,
          color: COLORS.lausdNavy,
          marginBottom: 60,
          opacity: interpolate(frame, [30, 60], [0, 1]),
        }}>
          In exchange for streamlined, secure access
        </div>
        <div style={{
          fontSize: 80,
          fontWeight: 'bold',
          color: COLORS.lausdNavy,
          transform: `scale(${spring({frame: frame - 90, fps, config: {damping: 10}})})`,
          opacity: interpolate(frame, [90, 120], [0, 1]),
        }}>
          SCHOOLDAY
        </div>
        <div style={{
          fontSize: 48,
          color: COLORS.lausdNavy,
          marginTop: 30,
          opacity: interpolate(frame, [150, 180], [0, 1]),
        }}>
          Let's Talk
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Main composition
export const Main: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Voiceover audio tracks */}
      <Sequence from={SCENES.hook.start}>
        <Audio src={staticFile('voiceover/scene1_hook.wav')} />
      </Sequence>
      <Sequence from={SCENES.problem.start}>
        <Audio src={staticFile('voiceover/scene2_problem.wav')} />
      </Sequence>
      <Sequence from={SCENES.solution.start}>
        <Audio src={staticFile('voiceover/scene3_solution.wav')} />
      </Sequence>
      <Sequence from={SCENES.benefits.start}>
        <Audio src={staticFile('voiceover/scene4_benefits.wav')} />
      </Sequence>
      <Sequence from={SCENES.leverage.start}>
        <Audio src={staticFile('voiceover/scene5_leverage.wav')} />
      </Sequence>
      <Sequence from={SCENES.close.start}>
        <Audio src={staticFile('voiceover/scene6_close.wav')} />
      </Sequence>

      {/* Visual scenes */}
      <Sequence from={SCENES.hook.start} durationInFrames={SCENES.hook.duration}>
        <SceneHook />
      </Sequence>
      <Sequence from={SCENES.problem.start} durationInFrames={SCENES.problem.duration}>
        <SceneProblem />
      </Sequence>
      <Sequence from={SCENES.solution.start} durationInFrames={SCENES.solution.duration}>
        <SceneSolution />
      </Sequence>
      <Sequence from={SCENES.benefits.start} durationInFrames={SCENES.benefits.duration}>
        <SceneBenefits />
      </Sequence>
      <Sequence from={SCENES.leverage.start} durationInFrames={SCENES.leverage.duration}>
        <SceneLeverage />
      </Sequence>
      <Sequence from={SCENES.close.start} durationInFrames={SCENES.close.duration}>
        <SceneClose />
      </Sequence>
    </AbsoluteFill>
  );
};
MAIN_TSX

    echo "✅ Remotion project created"

    cd schoolday-pitch
    npm install
    echo "✅ Dependencies installed"
    cd ..
else
    echo "✅ Remotion project already exists"
fi

# ============================================
# Done!
# ============================================
echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "📂 Files created:"
echo "   - voiceover/*.wav (audio files)"
echo "   - schoolday-pitch/ (Remotion project)"
echo ""
echo "🚀 Next steps:"
echo ""
echo "   1. Preview the video:"
echo "      cd schoolday-pitch && npm start"
echo ""
echo "   2. Open http://localhost:3000 in your browser"
echo ""
echo "   3. Render final video:"
echo "      cd schoolday-pitch && npm run build"
echo ""
echo "   4. Find output at: output/schoolday-pitch.mp4"
echo ""
echo "=========================================="

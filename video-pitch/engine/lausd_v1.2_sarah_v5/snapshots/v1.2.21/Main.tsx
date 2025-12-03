import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
} from 'remotion';

// Color palette - LAUSD colors
const COLORS = {
  lausdGold: '#FFB81C',
  lausdNavy: '#003087',
  white: '#FFFFFF',
  successGreen: '#22C55E',
  riskRed: '#EF4444',
  gray: '#64748B',
  coral: '#FF8A80', // For contrast against navy
};

// v1.2.21 Scene durations - Fixed "databreach" pause (single word, no hyphen)
// Total: 106.37 seconds
// Voice: af_sarah (female, authoritative) - from lausd_v1.2_sarah_v5
// Audio: Clean concatenation with 0.8s gaps
//
// KEY INSIGHT: For cross-fade transitions to work, scenes must OVERLAP.
// Visual starts when PREVIOUS scene's audio ENDS (not after the 0.8s gap).
//
// Audio timeline (in full_voiceover_v1.2.21.mp3):
//   hook:        0.00s - 9.09s (fixed: "databreach" as single word)
//   hookStats:   9.89s - 21.99s
//   problem:     22.79s - 34.62s
//   solution:    35.42s - 51.38s
//   portal:      52.18s - 57.86s
//   integration: 58.66s - 75.54s
//   benefits:    76.34s - 88.01s
//   leverage:    88.81s - 101.02s
//   close:       101.82s - 106.37s

const FADE_FRAMES = 12; // 0.4s transition duration at 30fps

// Calculate visual START as previous audio END, duration extends to this scene's audio END + fade
const SCENES = {
  hook: {start: Math.round(0.00 * 30), duration: Math.round((9.09 - 0.00) * 30) + FADE_FRAMES},
  hookStats: {start: Math.round(9.09 * 30), duration: Math.round((21.99 - 9.09) * 30) + FADE_FRAMES},
  problem: {start: Math.round(21.99 * 30), duration: Math.round((34.62 - 21.99) * 30) + FADE_FRAMES},
  solution: {start: Math.round(34.62 * 30), duration: Math.round((51.38 - 34.62) * 30) + FADE_FRAMES},
  portal: {start: Math.round(51.38 * 30), duration: Math.round((57.86 - 51.38) * 30) + FADE_FRAMES},
  integration: {start: Math.round(57.86 * 30), duration: Math.round((75.54 - 57.86) * 30) + FADE_FRAMES},
  benefits: {start: Math.round(75.54 * 30), duration: Math.round((88.01 - 75.54) * 30) + FADE_FRAMES},
  leverage: {start: Math.round(88.01 * 30), duration: Math.round((101.02 - 88.01) * 30) + FADE_FRAMES},
  close: {start: Math.round(101.02 * 30), duration: Math.round((106.37 - 101.02) * 30)},
};

// Slide transition wrapper component - fade + subtle slide/scale
const SlideTransition: React.FC<{
  children: React.ReactNode;
  durationInFrames: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
  direction?: 'left' | 'right' | 'up' | 'down' | 'scale';
}> = ({children, durationInFrames, fadeIn = true, fadeOut = true, direction = 'scale'}) => {
  const frame = useCurrentFrame();

  let opacity = 1;
  let transform = 'none';

  // Transition in at start
  if (fadeIn && frame < FADE_FRAMES) {
    opacity = interpolate(frame, [0, FADE_FRAMES], [0, 1], {extrapolateRight: 'clamp'});
    const progress = interpolate(frame, [0, FADE_FRAMES], [0, 1], {extrapolateRight: 'clamp'});
    if (direction === 'scale') {
      const scale = interpolate(progress, [0, 1], [1.02, 1]);
      transform = `scale(${scale})`;
    } else if (direction === 'left') {
      const x = interpolate(progress, [0, 1], [20, 0]);
      transform = `translateX(${x}px)`;
    } else if (direction === 'right') {
      const x = interpolate(progress, [0, 1], [-20, 0]);
      transform = `translateX(${x}px)`;
    }
  }

  // Transition out at end
  if (fadeOut && frame > durationInFrames - FADE_FRAMES) {
    opacity = interpolate(
      frame,
      [durationInFrames - FADE_FRAMES, durationInFrames],
      [1, 0],
      {extrapolateLeft: 'clamp'}
    );
    const progress = interpolate(
      frame,
      [durationInFrames - FADE_FRAMES, durationInFrames],
      [0, 1],
      {extrapolateLeft: 'clamp'}
    );
    if (direction === 'scale') {
      const scale = interpolate(progress, [0, 1], [1, 0.98]);
      transform = `scale(${scale})`;
    } else if (direction === 'left') {
      const x = interpolate(progress, [0, 1], [0, -20]);
      transform = `translateX(${x}px)`;
    } else if (direction === 'right') {
      const x = interpolate(progress, [0, 1], [0, 20]);
      transform = `translateX(${x}px)`;
    }
  }

  return (
    <AbsoluteFill style={{opacity, transform}}>
      {children}
    </AbsoluteFill>
  );
};

// Scene 1a: PowerSchool Punch (v1.2 - short, devastating)
const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const warningPulse = Math.sin(frame * 0.15) * 0.1 + 0.9;
  const breachScale = spring({frame: frame - 15, fps, config: {damping: 12}});

  return (
    <AbsoluteFill style={{
      background: 'linear-gradient(135deg, #1a0505 0%, #2d0a0a 50%, #1a0505 100%)',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Red alert pulse */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(circle at center, transparent 30%, rgba(255,0,0,${0.15 * warningPulse}) 100%)`,
      }} />

      <div style={{textAlign: 'center'}}>
        <div style={{
          fontSize: 42,
          color: COLORS.riskRed,
          fontWeight: 600,
          letterSpacing: 4,
          marginBottom: 20,
          opacity: interpolate(frame, [0, 15], [0, 1], {extrapolateRight: 'clamp'}),
        }}>
          DECEMBER 2024
        </div>

        <div style={{
          fontSize: 80,
          fontWeight: 800,
          color: COLORS.white,
          transform: `scale(${breachScale})`,
          textShadow: '0 0 50px rgba(255,68,68,0.6)',
          marginBottom: 40,
        }}>
          POWERSCHOOL BREACHED
        </div>

        <div style={{
          display: 'flex',
          gap: 80,
          justifyContent: 'center',
          opacity: interpolate(frame, [50, 80], [0, 1], {extrapolateRight: 'clamp'}),
        }}>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: 72, fontWeight: 800, color: COLORS.riskRed}}>62M</div>
            <div style={{fontSize: 24, color: '#cccccc'}}>Student Records</div>
          </div>
        </div>

        <div style={{
          marginTop: 40,
          fontSize: 36,
          color: COLORS.white,
          fontWeight: 600,
          opacity: interpolate(frame, [90, 130], [0, 1], {extrapolateRight: 'clamp'}),
        }}>
          The largest K-12 data breach in history.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 1b: LAUSD Stats (v1.2.4 - with LAUSD context)
const SceneHookStats: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const stats = [
    {value: '500K', label: 'Students', delay: 15},
    {value: '1,000', label: 'Schools', delay: 35},
    {value: '100s', label: 'Vendors/Year', delay: 55},
  ];

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${COLORS.lausdNavy} 0%, #001845 100%)`,
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{textAlign: 'center'}}>
        {/* LAUSD Header */}
        <div style={{
          fontSize: 52,
          fontWeight: 700,
          color: COLORS.white,
          marginBottom: 50,
          opacity: interpolate(frame, [0, 15], [0, 1], {extrapolateRight: 'clamp'}),
          letterSpacing: 3,
        }}>
          FOR <span style={{color: COLORS.lausdGold}}>LAUSD</span>
        </div>

        <div style={{display: 'flex', gap: 80, justifyContent: 'center', marginBottom: 60}}>
          {stats.map((stat, i) => (
            <div key={i} style={{
              textAlign: 'center',
              opacity: interpolate(frame, [stat.delay, stat.delay + 15], [0, 1], {extrapolateRight: 'clamp'}),
              transform: `scale(${spring({frame: frame - stat.delay, fps, config: {damping: 12}})})`,
            }}>
              <div style={{
                fontSize: 90,
                fontWeight: 800,
                color: COLORS.lausdGold,
                textShadow: '0 0 30px rgba(255,184,28,0.4)',
              }}>{stat.value}</div>
              <div style={{fontSize: 28, color: COLORS.white, fontWeight: 500}}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{
          fontSize: 38,
          color: COLORS.white,
          opacity: interpolate(frame, [100, 130], [0, 1], {extrapolateRight: 'clamp'}),
        }}>
          Each vendor takes <span style={{color: COLORS.riskRed, fontWeight: 700}}>weeks</span> to review.
        </div>

        <div style={{
          marginTop: 25,
          fontSize: 48,
          fontWeight: 700,
          color: COLORS.lausdGold,
          opacity: interpolate(frame, [160, 190], [0, 1], {extrapolateRight: 'clamp'}),
        }}>
          That&apos;s about to change.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: The Problem (v1.0 style - proven to work)
const SceneProblem: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{
      backgroundColor: COLORS.white,
      padding: 100,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <div style={{textAlign: 'center'}}>
        <h1 style={{
          fontSize: 72,
          color: COLORS.riskRed,
          marginBottom: 60,
          fontWeight: 'bold',
        }}>
          The Current Reality
        </h1>
        <div style={{display: 'flex', flexDirection: 'column', gap: 50, alignItems: 'center'}}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 40,
          opacity: interpolate(frame, [0, 20], [0, 1], {extrapolateRight: 'clamp'}),
          transform: `translateX(${interpolate(frame, [0, 20], [-50, 0], {extrapolateRight: 'clamp'})}px)`,
        }}>
          <div style={{fontSize: 80, width: 100}}>📋</div>
          <div style={{fontSize: 48, color: COLORS.lausdNavy}}>
            <strong style={{color: COLORS.riskRed}}>71 Questions</strong> per application
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 40,
          opacity: interpolate(frame, [30, 50], [0, 1], {extrapolateRight: 'clamp'}),
          transform: `translateX(${interpolate(frame, [30, 50], [-50, 0], {extrapolateRight: 'clamp'})}px)`,
        }}>
          <div style={{fontSize: 80, width: 100}}>⏱️</div>
          <div style={{fontSize: 48, color: COLORS.lausdNavy}}>
            <strong style={{color: COLORS.riskRed}}>Weeks</strong> of manual review per vendor
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 40,
          opacity: interpolate(frame, [60, 80], [0, 1], {extrapolateRight: 'clamp'}),
          transform: `translateX(${interpolate(frame, [60, 80], [-50, 0], {extrapolateRight: 'clamp'})}px)`,
        }}>
          <div style={{fontSize: 80, width: 100}}>💸</div>
          <div style={{fontSize: 48, color: COLORS.lausdNavy}}>
            <strong style={{color: COLORS.riskRed}}>$16-19/school/month</strong> → Clever fees
          </div>
        </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: The Solution (v1.0 style)
const SceneSolution: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{
      backgroundColor: COLORS.lausdNavy,
      padding: 100,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <div style={{textAlign: 'center'}}>
      <div style={{
        fontSize: 80,
        color: COLORS.lausdGold,
        fontWeight: 'bold',
        marginBottom: 60,
        textAlign: 'center',
        transform: `scale(${spring({frame, fps, config: {damping: 12}})})`,
      }}>
        SCHOOLDAY
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 50,
        marginBottom: 60,
      }}>
        <div style={{
          background: COLORS.white,
          borderRadius: 24,
          padding: 40,
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          transform: `scale(${spring({frame: frame - 10, fps, config: {damping: 12}})})`,
        }}>
          <div style={{fontSize: 80, fontWeight: 'bold', color: COLORS.successGreen}}>13</div>
          <div style={{fontSize: 28, color: COLORS.lausdNavy, fontWeight: 600}}>Questions</div>
        </div>
        <div style={{
          fontSize: 60,
          color: COLORS.white,
          alignSelf: 'center',
          opacity: interpolate(frame, [30, 45], [0, 1]),
        }}>→</div>
        <div style={{
          background: COLORS.white,
          borderRadius: 24,
          padding: 40,
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          transform: `scale(${spring({frame: frame - 30, fps, config: {damping: 12}})})`,
        }}>
          <div style={{fontSize: 80, fontWeight: 'bold', color: COLORS.successGreen}}>2</div>
          <div style={{fontSize: 28, color: COLORS.lausdNavy, fontWeight: 600}}>Minutes</div>
        </div>
        <div style={{
          fontSize: 60,
          color: COLORS.white,
          alignSelf: 'center',
          opacity: interpolate(frame, [50, 65], [0, 1]),
        }}>→</div>
        <div style={{
          background: COLORS.successGreen,
          borderRadius: 24,
          padding: 40,
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          transform: `scale(${spring({frame: frame - 50, fps, config: {damping: 12}})})`,
        }}>
          <div style={{fontSize: 80}}>✓</div>
          <div style={{fontSize: 28, color: COLORS.white, fontWeight: 600}}>Approved</div>
        </div>
      </div>

      <div style={{
        textAlign: 'center',
        opacity: interpolate(frame, [80, 110], [0, 1], {extrapolateRight: 'clamp'}),
      }}>
        <div style={{fontSize: 48, color: COLORS.lausdGold, fontWeight: 'bold', marginBottom: 15}}>
          80% of vendors never touch student data
        </div>
        <div style={{
          fontSize: 32,
          color: COLORS.white,
          display: 'inline-block',
          background: 'rgba(255,255,255,0.15)',
          padding: '12px 30px',
          borderRadius: 12,
          fontFamily: 'monospace',
        }}>
          TKN_STU_8X9Y2Z → Zero Privacy Risk
        </div>
      </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene: Portal Demo (v1.2.19 - Enlarged portal view for detail visibility)
const ScenePortal: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${COLORS.lausdNavy} 0%, #001845 100%)`,
      padding: 30,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <div style={{textAlign: 'center', width: '100%'}}>
        {/* Title - smaller to give more room to screenshot */}
        <div style={{
          fontSize: 42,
          color: COLORS.lausdGold,
          fontWeight: 700,
          marginBottom: 20,
          opacity: interpolate(frame, [0, 15], [0, 1], {extrapolateRight: 'clamp'}),
        }}>
          One Intelligent Portal
        </div>

        {/* Portal Screenshot - ENLARGED for detail visibility */}
        <div style={{
          transform: `scale(${spring({frame: frame - 10, fps, config: {damping: 12}})})`,
          boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
          borderRadius: 12,
          overflow: 'hidden',
          border: '3px solid rgba(255,184,28,0.4)',
          display: 'inline-block',
        }}>
          <Img
            src={staticFile('portal-screenshot.png')}
            style={{
              width: 1700,
              height: 'auto',
              display: 'block',
            }}
          />
        </div>

        {/* Bottom tagline - positioned closer */}
        <div style={{
          marginTop: 20,
          fontSize: 30,
          color: COLORS.white,
          opacity: interpolate(frame, [60, 90], [0, 1], {extrapolateRight: 'clamp'}),
        }}>
          <span style={{color: COLORS.successGreen, fontWeight: 600}}>Vendors integrate themselves.</span>
          <span style={{marginLeft: 20}}>Your team reviews, not builds.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 4: Integration Breadth (v1.0 style)
const SceneIntegration: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const integrations = [
    {icon: '🔐', title: 'Single Sign-On', subtitle: 'SAML + OpenID', delay: 0},
    {icon: '📚', title: 'Rostering', subtitle: 'OneRoster + Ed-Fi', delay: 20},
    {icon: '🔗', title: 'LTI 1.3', subtitle: 'Deep Linking', delay: 40},
    {icon: '💬', title: 'Messaging', subtitle: 'Tokenized Relay', delay: 60},
  ];

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${COLORS.lausdNavy} 0%, #001845 100%)`,
      padding: 80,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <div style={{textAlign: 'center'}}>
      <div style={{
        fontSize: 64,
        color: COLORS.lausdGold,
        fontWeight: 'bold',
        marginBottom: 50,
        textAlign: 'center',
        opacity: interpolate(frame, [0, 20], [0, 1]),
      }}>
        One Platform, Every Integration
      </div>

      <div style={{display: 'flex', justifyContent: 'center', gap: 35, marginBottom: 50}}>
        {integrations.map((item, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 20,
            padding: 35,
            textAlign: 'center',
            width: 260,
            border: '2px solid rgba(255,255,255,0.2)',
            opacity: interpolate(frame, [item.delay, item.delay + 20], [0, 1]),
            transform: `scale(${spring({frame: frame - item.delay, fps, config: {damping: 12}})})`,
          }}>
            <div style={{fontSize: 60, marginBottom: 12}}>{item.icon}</div>
            <div style={{fontSize: 30, fontWeight: 'bold', color: COLORS.lausdGold}}>
              {item.title}
            </div>
            <div style={{fontSize: 20, color: COLORS.white, opacity: 0.8}}>
              {item.subtitle}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        textAlign: 'center',
        opacity: interpolate(frame, [120, 150], [0, 1]),
      }}>
        <div style={{
          fontSize: 32,
          color: COLORS.white,
          background: 'rgba(255,184,28,0.2)',
          padding: '18px 45px',
          borderRadius: 14,
          display: 'inline-block',
          border: `2px solid ${COLORS.lausdGold}`,
        }}>
          📧 Vendors message without seeing real emails or phones
        </div>
      </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 5: LAUSD Benefits (updated for ~500K)
const SceneBenefits: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const benefits = [
    {icon: '📊', title: '80% Fewer', subtitle: 'Manual Reviews', color: COLORS.successGreen},
    {icon: '📝', title: 'Full Audit', subtitle: 'FERPA/COPPA Built-in', color: COLORS.lausdGold},
    {icon: '🏛️', title: 'Your Platform', subtitle: 'No Middleman Fees', color: COLORS.coral},
  ];

  return (
    <AbsoluteFill style={{
      backgroundColor: COLORS.white,
      padding: 80,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <div style={{textAlign: 'center'}}>
      <h1 style={{
        fontSize: 56,
        color: COLORS.lausdNavy,
        marginBottom: 50,
        textAlign: 'center',
        fontWeight: 'bold',
        opacity: interpolate(frame, [0, 20], [0, 1]),
      }}>
        For LA Unified&apos;s Half Million Students:
      </h1>
      <div style={{display: 'flex', justifyContent: 'center', gap: 45}}>
        {benefits.map((benefit, i) => (
          <div key={i} style={{
            background: `linear-gradient(135deg, ${COLORS.lausdNavy} 0%, #001845 100%)`,
            borderRadius: 24,
            padding: 45,
            textAlign: 'center',
            width: 340,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            opacity: interpolate(frame, [20 + i * 30, 40 + i * 30], [0, 1], {extrapolateRight: 'clamp'}),
            transform: `translateY(${interpolate(frame, [20 + i * 30, 40 + i * 30], [40, 0], {extrapolateRight: 'clamp'})}px) scale(${spring({frame: frame - 20 - i * 30, fps, config: {damping: 12}})})`,
          }}>
            <div style={{fontSize: 70, marginBottom: 12}}>{benefit.icon}</div>
            <div style={{fontSize: 40, fontWeight: 'bold', color: benefit.color, marginBottom: 6}}>
              {benefit.title}
            </div>
            <div style={{fontSize: 26, color: COLORS.white}}>
              {benefit.subtitle}
            </div>
          </div>
        ))}
      </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 6: Vendor Leverage
const SceneLeverage: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const vendorBenefits = ['💰 Save Thousands', '🛡️ Zero Liability', '⚡ Instant Access'];

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${COLORS.lausdNavy} 0%, #001845 100%)`,
      padding: 100,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <div style={{textAlign: 'center'}}>
        <div style={{
          fontSize: 44,
          color: COLORS.white,
          marginBottom: 35,
          opacity: interpolate(frame, [0, 15], [0, 1]),
        }}>
          Vendors using SchoolDay get:
        </div>
        <div style={{display: 'flex', justifyContent: 'center', gap: 30, marginBottom: 50}}>
          {vendorBenefits.map((item, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.12)',
              borderRadius: 16,
              padding: '22px 35px',
              color: COLORS.white,
              fontSize: 32,
              fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.2)',
              opacity: interpolate(frame, [15 + i * 15, 30 + i * 15], [0, 1]),
              transform: `scale(${spring({frame: frame - 15 - i * 15, fps, config: {damping: 10}})})`,
            }}>
              {item}
            </div>
          ))}
        </div>
        <div style={{
          fontSize: 72,
          fontWeight: 'bold',
          color: COLORS.lausdGold,
          opacity: interpolate(frame, [80, 110], [0, 1]),
          transform: `scale(${spring({frame: frame - 80, fps, config: {damping: 8}})})`,
          textShadow: '0 0 50px rgba(255,184,28,0.5)',
        }}>
          = YOUR LEVERAGE
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 7: Close with Logo and Data Sovereignty Tagline (v1.2.1)
const SceneClose: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${COLORS.lausdNavy} 0%, #0052D4 100%)`,
      padding: 100,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <div style={{textAlign: 'center'}}>
        {/* SchoolDay Logo from website */}
        <div style={{
          marginBottom: 40,
          transform: `scale(${spring({frame, fps, config: {damping: 10}})})`,
        }}>
          <Img
            src={staticFile('schoolday-logo.svg')}
            style={{
              width: 400,
              height: 'auto',
              filter: 'brightness(0) invert(1)', // Make it white
            }}
          />
        </div>

        {/* Data Sovereignty Tagline */}
        <div style={{
          opacity: interpolate(frame, [20, 50], [0, 1]),
          display: 'flex',
          gap: 20,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <span style={{fontSize: 42, fontWeight: 700, color: COLORS.white}}>Your students.</span>
          <span style={{fontSize: 42, fontWeight: 700, color: COLORS.lausdGold}}>Your data.</span>
          <span style={{fontSize: 42, fontWeight: 700, color: COLORS.successGreen}}>Your control.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Main composition - v1.2.18 with portal scene added after solution
export const Main: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {/* v1.2.21 voiceover - fixed "databreach" pause */}
      <Audio src={staticFile('voiceover/full_voiceover_v1.2.21.mp3')} />

      {/* Scene 1a: PowerSchool Punch (no fade-in, starts video) */}
      <Sequence from={SCENES.hook.start} durationInFrames={SCENES.hook.duration}>
        <SlideTransition durationInFrames={SCENES.hook.duration} fadeIn={false} fadeOut={true}>
          <SceneHook />
        </SlideTransition>
      </Sequence>

      {/* Scene 1b: LAUSD Stats (slide transition from hook) */}
      <Sequence from={SCENES.hookStats.start} durationInFrames={SCENES.hookStats.duration}>
        <SlideTransition durationInFrames={SCENES.hookStats.duration} fadeIn={true} fadeOut={true}>
          <SceneHookStats />
        </SlideTransition>
      </Sequence>

      {/* Scene 2: Problem */}
      <Sequence from={SCENES.problem.start} durationInFrames={SCENES.problem.duration}>
        <SlideTransition durationInFrames={SCENES.problem.duration} fadeIn={true} fadeOut={true}>
          <SceneProblem />
        </SlideTransition>
      </Sequence>

      {/* Scene 3: Solution */}
      <Sequence from={SCENES.solution.start} durationInFrames={SCENES.solution.duration}>
        <SlideTransition durationInFrames={SCENES.solution.duration} fadeIn={true} fadeOut={true}>
          <SceneSolution />
        </SlideTransition>
      </Sequence>

      {/* Scene 3b: Portal Demo (NEW in v1.2.18) */}
      <Sequence from={SCENES.portal.start} durationInFrames={SCENES.portal.duration}>
        <SlideTransition durationInFrames={SCENES.portal.duration} fadeIn={true} fadeOut={true}>
          <ScenePortal />
        </SlideTransition>
      </Sequence>

      {/* Scene 4: Integration */}
      <Sequence from={SCENES.integration.start} durationInFrames={SCENES.integration.duration}>
        <SlideTransition durationInFrames={SCENES.integration.duration} fadeIn={true} fadeOut={true}>
          <SceneIntegration />
        </SlideTransition>
      </Sequence>

      {/* Scene 5: Benefits */}
      <Sequence from={SCENES.benefits.start} durationInFrames={SCENES.benefits.duration}>
        <SlideTransition durationInFrames={SCENES.benefits.duration} fadeIn={true} fadeOut={true}>
          <SceneBenefits />
        </SlideTransition>
      </Sequence>

      {/* Scene 6: Leverage */}
      <Sequence from={SCENES.leverage.start} durationInFrames={SCENES.leverage.duration}>
        <SlideTransition durationInFrames={SCENES.leverage.duration} fadeIn={true} fadeOut={true}>
          <SceneLeverage />
        </SlideTransition>
      </Sequence>

      {/* Scene 7: Close with Logo + Tagline (no fade-out, ends video) */}
      <Sequence from={SCENES.close.start} durationInFrames={SCENES.close.duration}>
        <SlideTransition durationInFrames={SCENES.close.duration} fadeIn={true} fadeOut={false}>
          <SceneClose />
        </SlideTransition>
      </Sequence>
    </AbsoluteFill>
  );
};

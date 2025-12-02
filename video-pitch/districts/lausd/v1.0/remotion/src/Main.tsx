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

// Color palette - LAUSD colors
const COLORS = {
  lausdGold: '#FFB81C',
  lausdNavy: '#003087',
  white: '#FFFFFF',
  successGreen: '#22C55E',
  riskRed: '#EF4444',
  gray: '#64748B',
};

// Scene durations in frames (30fps) - based on actual Edge TTS audio durations
// Total: 85.68 seconds (2570 frames)
// Audio: full_voiceover.mp3 (concatenated)
const SCENES = {
  hook: {start: 0, duration: Math.round(10.344 * 30)},                    // 0-10.3s
  problem: {start: Math.round(10.344 * 30), duration: Math.round(13.008 * 30)},   // 10.3-23.4s
  solution: {start: Math.round(23.352 * 30), duration: Math.round(13.344 * 30)},  // 23.4-36.7s
  integration: {start: Math.round(36.696 * 30), duration: Math.round(17.040 * 30)}, // 36.7-53.7s
  benefits: {start: Math.round(53.736 * 30), duration: Math.round(13.248 * 30)},  // 53.7-67.0s
  leverage: {start: Math.round(66.984 * 30), duration: Math.round(11.208 * 30)},  // 67.0-78.2s
  close: {start: Math.round(78.192 * 30), duration: Math.round(7.488 * 30)},      // 78.2-85.7s
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

// Scene 1: Hook - The Numbers
const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{
      backgroundColor: COLORS.lausdNavy,
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        display: 'flex',
        gap: 80,
        opacity,
      }}>
        <div style={{textAlign: 'center', color: COLORS.white}}>
          <div style={{fontSize: 140, fontWeight: 'bold', color: COLORS.lausdGold}}>
            <AnimatedNumber value={670000} />
          </div>
          <div style={{fontSize: 36, letterSpacing: 2}}>STUDENTS</div>
        </div>
        <div style={{textAlign: 'center', color: COLORS.white}}>
          <div style={{fontSize: 140, fontWeight: 'bold', color: COLORS.lausdGold}}>
            <AnimatedNumber value={1000} suffix="+" />
          </div>
          <div style={{fontSize: 36, letterSpacing: 2}}>SCHOOLS</div>
        </div>
        <div style={{textAlign: 'center', color: COLORS.white}}>
          <div style={{fontSize: 140, fontWeight: 'bold', color: COLORS.lausdGold}}>100s</div>
          <div style={{fontSize: 36, letterSpacing: 2}}>VENDORS/YEAR</div>
        </div>
      </div>
      <div style={{
        position: 'absolute',
        bottom: 120,
        fontSize: 52,
        color: COLORS.white,
        textAlign: 'center',
        opacity: interpolate(frame, [120, 180], [0, 1], {extrapolateRight: 'clamp'}),
      }}>
        Each takes <span style={{color: COLORS.lausdGold, fontWeight: 'bold'}}>weeks</span> to review.
        <br />
        <span style={{fontSize: 64, fontWeight: 'bold'}}>That&apos;s about to change.</span>
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: The Problem
const SceneProblem: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{
      backgroundColor: COLORS.white,
      padding: 100,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <h1 style={{
        fontSize: 72,
        color: COLORS.riskRed,
        marginBottom: 60,
        fontWeight: 'bold',
      }}>
        The Current Reality
      </h1>
      <div style={{display: 'flex', flexDirection: 'column', gap: 50}}>
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
    </AbsoluteFill>
  );
};

// Scene 3: The Solution
const SceneSolution: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{
      backgroundColor: COLORS.lausdNavy,
      padding: 100,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
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
          80% of vendors never touch PII
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
    </AbsoluteFill>
  );
};

// Scene 4: Integration Breadth (NEW)
const SceneIntegration: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const integrations = [
    {icon: '🔐', title: 'SSO', subtitle: 'SAML + OpenID', delay: 0},
    {icon: '📚', title: 'Rostering', subtitle: 'OneRoster + Ed-Fi', delay: 30},
    {icon: '🔗', title: 'LTI 1.3', subtitle: 'Deep Linking', delay: 60},
    {icon: '💬', title: 'Messaging', subtitle: 'Tokenized Relay', delay: 90},
  ];

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${COLORS.lausdNavy} 0%, #001845 100%)`,
      padding: 80,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
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

      <div style={{display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 60}}>
        {integrations.map((item, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 20,
            padding: 40,
            textAlign: 'center',
            width: 280,
            border: '2px solid rgba(255,255,255,0.2)',
            opacity: interpolate(frame, [item.delay, item.delay + 25], [0, 1]),
            transform: `scale(${spring({frame: frame - item.delay, fps, config: {damping: 12}})})`,
          }}>
            <div style={{fontSize: 70, marginBottom: 15}}>{item.icon}</div>
            <div style={{fontSize: 36, fontWeight: 'bold', color: COLORS.lausdGold}}>
              {item.title}
            </div>
            <div style={{fontSize: 24, color: COLORS.white, opacity: 0.8}}>
              {item.subtitle}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        textAlign: 'center',
        opacity: interpolate(frame, [150, 180], [0, 1]),
        marginTop: 20,
      }}>
        <div style={{
          fontSize: 36,
          color: COLORS.white,
          background: 'rgba(255,184,28,0.2)',
          padding: '20px 50px',
          borderRadius: 16,
          display: 'inline-block',
          border: `2px solid ${COLORS.lausdGold}`,
        }}>
          📧 <span style={{color: COLORS.lausdGold}}>TKN_STU_xxx@relay.schoolday</span>
          <br />
          <span style={{fontSize: 28, opacity: 0.9}}>Vendors message students without seeing real emails</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 5: LAUSD Benefits
const SceneBenefits: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const benefits = [
    {icon: '📊', title: '80% Fewer', subtitle: 'Manual Reviews', color: COLORS.successGreen},
    {icon: '📝', title: 'Full Audit', subtitle: 'FERPA/COPPA Built-in', color: COLORS.lausdGold},
    {icon: '🏛️', title: 'Your Platform', subtitle: 'No Middleman Fees', color: COLORS.lausdNavy},
  ];

  return (
    <AbsoluteFill style={{
      backgroundColor: COLORS.white,
      padding: 80,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <h1 style={{
        fontSize: 64,
        color: COLORS.lausdNavy,
        marginBottom: 60,
        textAlign: 'center',
        fontWeight: 'bold',
        opacity: interpolate(frame, [0, 20], [0, 1]),
      }}>
        For LAUSD, This Means:
      </h1>
      <div style={{display: 'flex', justifyContent: 'center', gap: 50}}>
        {benefits.map((benefit, i) => (
          <div key={i} style={{
            background: `linear-gradient(135deg, ${COLORS.lausdNavy} 0%, #001845 100%)`,
            borderRadius: 24,
            padding: 50,
            textAlign: 'center',
            width: 350,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            opacity: interpolate(frame, [30 + i * 40, 50 + i * 40], [0, 1], {extrapolateRight: 'clamp'}),
            transform: `translateY(${interpolate(frame, [30 + i * 40, 50 + i * 40], [40, 0], {extrapolateRight: 'clamp'})}px) scale(${spring({frame: frame - 30 - i * 40, fps, config: {damping: 12}})})`,
          }}>
            <div style={{fontSize: 80, marginBottom: 15}}>{benefit.icon}</div>
            <div style={{fontSize: 44, fontWeight: 'bold', color: benefit.color, marginBottom: 8}}>
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
          fontSize: 48,
          color: COLORS.white,
          marginBottom: 40,
          opacity: interpolate(frame, [0, 20], [0, 1]),
        }}>
          Vendors using SchoolDay get:
        </div>
        <div style={{display: 'flex', justifyContent: 'center', gap: 35, marginBottom: 60}}>
          {vendorBenefits.map((item, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.12)',
              borderRadius: 18,
              padding: '25px 40px',
              color: COLORS.white,
              fontSize: 36,
              fontWeight: 600,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              opacity: interpolate(frame, [20 + i * 20, 40 + i * 20], [0, 1]),
              transform: `scale(${spring({frame: frame - 20 - i * 20, fps, config: {damping: 10}})})`,
            }}>
              {item}
            </div>
          ))}
        </div>
        <div style={{
          fontSize: 80,
          fontWeight: 'bold',
          color: COLORS.lausdGold,
          opacity: interpolate(frame, [100, 130], [0, 1]),
          transform: `scale(${spring({frame: frame - 100, fps, config: {damping: 8}})})`,
          textShadow: '0 0 60px rgba(255,184,28,0.5)',
        }}>
          = YOUR LEVERAGE
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 7: The Close
const SceneClose: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{
      background: COLORS.lausdGold,
      padding: 100,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <div style={{textAlign: 'center'}}>
        <div style={{
          fontSize: 56,
          color: COLORS.lausdNavy,
          fontWeight: 'bold',
          marginBottom: 30,
          lineHeight: 1.3,
          opacity: interpolate(frame, [0, 20], [0, 1]),
        }}>
          Demand Significant Discounts
          <br />
          From Vendors
        </div>
        <div style={{
          transform: `scale(${spring({frame: frame - 60, fps, config: {damping: 10}})})`,
          opacity: interpolate(frame, [60, 90], [0, 1]),
        }}>
          <div style={{
            fontSize: 100,
            fontWeight: 'bold',
            color: COLORS.lausdNavy,
            letterSpacing: 8,
          }}>
            SCHOOLDAY
          </div>
          <div style={{
            fontSize: 48,
            color: COLORS.lausdNavy,
            marginTop: 30,
            fontWeight: 600,
            opacity: interpolate(frame, [100, 130], [0, 1]),
          }}>
            Let&apos;s Talk
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Main composition
export const Main: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {/* Single concatenated voiceover track - Edge TTS (Microsoft Neural) */}
      <Audio src={staticFile('voiceover/full_voiceover.mp3')} />

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
      <Sequence from={SCENES.integration.start} durationInFrames={SCENES.integration.duration}>
        <SceneIntegration />
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

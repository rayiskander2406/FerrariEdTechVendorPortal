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

// v1.1 Color palette - more security-focused
const COLORS = {
  securityRed: '#EF4444',
  darkRed: '#1a0a0a',
  sovereignBlue: '#003DA5',
  protectionGreen: '#22C55E',
  warningGold: '#FFB81C',
  white: '#FFFFFF',
  darkNavy: '#0a0a1a',
};

// Scene timing based on actual Edge TTS audio durations (v1.1)
// scene1_hook: 22.104s, scene2_problem: 23.688s, scene3_solution: 19.728s
// scene4_integration: 24.936s, scene5_leverage: 18.840s, scene6_close: 13.248s
// Total: 122.544s
const SCENES = {
  hook: {start: 0, duration: Math.round(22.104 * 30)},
  problem: {start: Math.round(22.104 * 30), duration: Math.round(23.688 * 30)},
  solution: {start: Math.round(45.792 * 30), duration: Math.round(19.728 * 30)},
  integration: {start: Math.round(65.520 * 30), duration: Math.round(24.936 * 30)},
  leverage: {start: Math.round(90.456 * 30), duration: Math.round(18.840 * 30)},
  close: {start: Math.round(109.296 * 30), duration: Math.round(13.248 * 30)},
};

// Scene 1: PowerSchool Breach Hook (NEW for v1.1)
const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {extrapolateRight: 'clamp'});
  const breachScale = spring({frame: frame - 20, fps, config: {damping: 12}});
  const statsOpacity = interpolate(frame, [60, 90], [0, 1], {extrapolateRight: 'clamp'});
  const warningPulse = Math.sin(frame * 0.1) * 0.1 + 0.9;

  return (
    <AbsoluteFill style={{
      background: 'linear-gradient(135deg, #1a0a0a 0%, #2d1515 50%, #1a0a0a 100%)',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Red alert overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(circle at center, transparent 30%, rgba(255,0,0,${0.1 * warningPulse}) 100%)`,
      }} />

      <div style={{textAlign: 'center', opacity: titleOpacity}}>
        <div style={{
          fontSize: 36,
          color: COLORS.securityRed,
          fontWeight: 600,
          letterSpacing: 4,
          marginBottom: 20,
        }}>
          DECEMBER 2024
        </div>

        <div style={{
          fontSize: 72,
          fontWeight: 800,
          color: COLORS.white,
          transform: `scale(${breachScale})`,
          textShadow: '0 0 40px rgba(255,68,68,0.5)',
          marginBottom: 40,
        }}>
          POWERSCHOOL BREACH
        </div>

        <div style={{opacity: statsOpacity, display: 'flex', gap: 60, justifyContent: 'center'}}>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: 64, fontWeight: 800, color: COLORS.securityRed}}>62M</div>
            <div style={{fontSize: 24, color: '#cccccc'}}>Student Records</div>
          </div>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: 64, fontWeight: 800, color: COLORS.securityRed}}>10M</div>
            <div style={{fontSize: 24, color: '#cccccc'}}>Teacher Records</div>
          </div>
        </div>

        <div style={{
          marginTop: 50,
          fontSize: 28,
          color: '#ff6666',
          opacity: interpolate(frame, [150, 200], [0, 1], {extrapolateRight: 'clamp'}),
        }}>
          SSNs + Medical Records + Grades Since 1985
        </div>

        <div style={{
          marginTop: 30,
          fontSize: 32,
          color: COLORS.white,
          fontWeight: 600,
          background: 'rgba(255,68,68,0.2)',
          padding: '15px 30px',
          borderRadius: 10,
          display: 'inline-block',
          opacity: interpolate(frame, [250, 300], [0, 1], {extrapolateRight: 'clamp'}),
        }}>
          Root Cause: No Multi-Factor Authentication
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: Data Sovereignty Problem (v1.1)
const Scene2Problem: React.FC = () => {
  const frame = useCurrentFrame();

  const dataFlowX = interpolate(frame, [0, 300], [0, 100], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{
      background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%)',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{textAlign: 'center'}}>
        <div style={{
          fontSize: 56,
          fontWeight: 800,
          color: COLORS.white,
          marginBottom: 20,
          opacity: interpolate(frame, [0, 30], [0, 1], {extrapolateRight: 'clamp'}),
        }}>
          DATA SOVEREIGNTY AT RISK
        </div>

        <div style={{
          fontSize: 28,
          color: COLORS.warningGold,
          marginBottom: 50,
          opacity: interpolate(frame, [20, 50], [0, 1], {extrapolateRight: 'clamp'}),
        }}>
          LAUSD: 516,000 Students + 784 Schools
        </div>

        {/* Data flowing out visualization */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
          marginBottom: 50,
        }}>
          <div style={{
            width: 200,
            height: 200,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #003DA5, #0052D4)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 10px 40px rgba(0,61,165,0.3)',
            opacity: interpolate(frame, [30, 60], [0, 1], {extrapolateRight: 'clamp'}),
          }}>
            <div style={{fontSize: 48, marginBottom: 10}}>🏫</div>
            <div style={{fontSize: 24, fontWeight: 700, color: COLORS.white}}>LAUSD</div>
          </div>

          {/* Arrows flowing out */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            transform: `translateX(${dataFlowX * 0.2}px)`,
          }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{
                width: 100,
                height: 4,
                background: `linear-gradient(90deg, ${COLORS.securityRed}, transparent)`,
                opacity: interpolate(frame, [60 + i * 15, 100 + i * 15], [0, 0.8], {extrapolateRight: 'clamp'}),
              }} />
            ))}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 15,
          }}>
            {['Vendor A', 'Vendor B', 'Vendor C', 'Vendor D'].map((vendor, i) => (
              <div key={vendor} style={{
                padding: '15px 25px',
                background: 'rgba(255,68,68,0.2)',
                borderRadius: 10,
                border: '1px solid rgba(255,68,68,0.5)',
                color: '#ff8888',
                fontSize: 18,
                opacity: interpolate(frame, [100 + i * 20, 140 + i * 20], [0, 1], {extrapolateRight: 'clamp'}),
              }}>
                {vendor}
              </div>
            ))}
          </div>
        </div>

        <div style={{
          fontSize: 36,
          color: COLORS.warningGold,
          fontWeight: 600,
          fontStyle: 'italic',
          opacity: interpolate(frame, [250, 300], [0, 1], {extrapolateRight: 'clamp'}),
        }}>
          &quot;Data sovereignty isn&apos;t optional. It&apos;s a responsibility.&quot;
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: SchoolDay Solution (v1.1 - Data Sovereignty Focus)
const Scene3Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const shieldScale = spring({frame: frame - 30, fps, config: {damping: 10}});
  const tokenOpacity = interpolate(frame, [90, 120], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{
      background: 'linear-gradient(135deg, #0a1a0a 0%, #1a3a1a 50%, #0a1a0a 100%)',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{textAlign: 'center'}}>
        <div style={{
          fontSize: 48,
          fontWeight: 800,
          color: COLORS.protectionGreen,
          marginBottom: 20,
          opacity: interpolate(frame, [0, 30], [0, 1], {extrapolateRight: 'clamp'}),
        }}>
          SCHOOLDAY RESTORES
        </div>

        <div style={{
          fontSize: 72,
          fontWeight: 800,
          color: COLORS.white,
          marginBottom: 50,
          opacity: interpolate(frame, [15, 45], [0, 1], {extrapolateRight: 'clamp'}),
        }}>
          DATA SOVEREIGNTY
        </div>

        {/* Shield with tokenization */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 60,
        }}>
          <div style={{
            width: 180,
            height: 200,
            background: `linear-gradient(180deg, ${COLORS.protectionGreen} 0%, #22aa22 100%)`,
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transform: `scale(${shieldScale})`,
            boxShadow: '0 0 60px rgba(68,255,68,0.4)',
          }}>
            <div style={{fontSize: 64}}>🛡️</div>
          </div>

          <div style={{opacity: tokenOpacity, textAlign: 'left'}}>
            <div style={{marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20}}>
              <span style={{fontSize: 24, color: COLORS.securityRed, textDecoration: 'line-through'}}>Real Name</span>
              <span style={{fontSize: 28, color: COLORS.white}}>→</span>
              <span style={{fontSize: 24, color: COLORS.protectionGreen, fontFamily: 'monospace'}}>TKN_STU_8X9Y2Z</span>
            </div>
            <div style={{marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20}}>
              <span style={{fontSize: 24, color: COLORS.securityRed, textDecoration: 'line-through'}}>Real Email</span>
              <span style={{fontSize: 28, color: COLORS.white}}>→</span>
              <span style={{fontSize: 24, color: COLORS.protectionGreen, fontFamily: 'monospace'}}>TOKEN@relay</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
              <span style={{fontSize: 24, color: COLORS.securityRed, textDecoration: 'line-through'}}>Real SSN</span>
              <span style={{fontSize: 28, color: COLORS.white}}>→</span>
              <span style={{fontSize: 24, color: COLORS.protectionGreen, fontFamily: 'monospace'}}>NEVER SHARED</span>
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 50,
          fontSize: 36,
          color: COLORS.white,
          fontWeight: 600,
          opacity: interpolate(frame, [200, 250], [0, 1], {extrapolateRight: 'clamp'}),
        }}>
          <span style={{color: COLORS.protectionGreen}}>80%</span> of vendors = Zero PII Exposure
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 4: Integration (v1.1)
const Scene4Integration: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const integrations = [
    {name: 'SSO', icon: '🔐', color: '#4488ff'},
    {name: 'Rostering', icon: '📋', color: '#44ff88'},
    {name: 'LTI 1.3', icon: '🔗', color: '#ff8844'},
    {name: 'Messaging', icon: '💬', color: '#aa44ff'},
  ];

  return (
    <AbsoluteFill style={{
      background: 'linear-gradient(135deg, #1a0a2a 0%, #2a1a4a 50%, #1a0a2a 100%)',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{textAlign: 'center'}}>
        <div style={{
          fontSize: 56,
          fontWeight: 800,
          color: COLORS.white,
          marginBottom: 60,
          opacity: interpolate(frame, [0, 30], [0, 1], {extrapolateRight: 'clamp'}),
        }}>
          ONE PLATFORM. EVERY INTEGRATION.
        </div>

        <div style={{display: 'flex', gap: 40, justifyContent: 'center', marginBottom: 60}}>
          {integrations.map((item, i) => {
            const itemScale = spring({frame: frame - 30 - i * 20, fps, config: {damping: 12}});
            return (
              <div key={item.name} style={{
                width: 180,
                height: 180,
                background: `linear-gradient(135deg, ${item.color}22, ${item.color}44)`,
                borderRadius: 20,
                border: `2px solid ${item.color}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                transform: `scale(${itemScale})`,
              }}>
                <div style={{fontSize: 48, marginBottom: 15}}>{item.icon}</div>
                <div style={{fontSize: 24, fontWeight: 700, color: COLORS.white}}>{item.name}</div>
              </div>
            );
          })}
        </div>

        <div style={{
          display: 'flex',
          gap: 30,
          justifyContent: 'center',
          opacity: interpolate(frame, [200, 250], [0, 1], {extrapolateRight: 'clamp'}),
        }}>
          <div style={{
            padding: '20px 40px',
            background: 'rgba(68,255,68,0.2)',
            borderRadius: 15,
            border: `2px solid ${COLORS.protectionGreen}`,
          }}>
            <div style={{fontSize: 48, fontWeight: 800, color: COLORS.protectionGreen}}>13</div>
            <div style={{fontSize: 20, color: COLORS.white}}>Questions</div>
          </div>
          <div style={{
            padding: '20px 40px',
            background: 'rgba(68,136,255,0.2)',
            borderRadius: 15,
            border: '2px solid #4488ff',
          }}>
            <div style={{fontSize: 48, fontWeight: 800, color: '#4488ff'}}>Minutes</div>
            <div style={{fontSize: 20, color: COLORS.white}}>To Approve</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 5: Leverage (v1.1)
const Scene5Leverage: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const scaleRotation = interpolate(frame, [60, 200], [-15, 15], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{
      background: 'linear-gradient(135deg, #1a1a0a 0%, #3a3a1a 50%, #1a1a0a 100%)',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{textAlign: 'center'}}>
        <div style={{
          fontSize: 64,
          fontWeight: 800,
          color: COLORS.warningGold,
          marginBottom: 50,
          opacity: interpolate(frame, [0, 30], [0, 1], {extrapolateRight: 'clamp'}),
        }}>
          YOUR LEVERAGE
        </div>

        {/* Balance scale visualization */}
        <div style={{
          position: 'relative',
          width: 600,
          height: 250,
          margin: '0 auto 50px',
        }}>
          {/* Fulcrum */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '40px solid transparent',
            borderRight: '40px solid transparent',
            borderBottom: `60px solid ${COLORS.warningGold}`,
          }} />

          {/* Beam */}
          <div style={{
            position: 'absolute',
            top: 80,
            left: '50%',
            width: 500,
            height: 8,
            background: COLORS.warningGold,
            transform: `translateX(-50%) rotate(${scaleRotation}deg)`,
            transformOrigin: 'center',
          }}>
            {/* District side (higher = more power) */}
            <div style={{
              position: 'absolute',
              left: -20,
              top: -100,
            }}>
              <div style={{
                width: 140,
                height: 90,
                background: COLORS.sovereignBlue,
                borderRadius: 10,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: 18,
                fontWeight: 700,
                color: COLORS.white,
              }}>
                <div>LAUSD</div>
                <div style={{fontSize: 12, opacity: 0.8}}>DATA OWNER</div>
              </div>
            </div>

            {/* Vendor side */}
            <div style={{
              position: 'absolute',
              right: -20,
              top: -50,
            }}>
              <div style={{
                width: 120,
                height: 70,
                background: '#666666',
                borderRadius: 10,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: 16,
                fontWeight: 700,
                color: COLORS.white,
              }}>
                Vendors
              </div>
            </div>
          </div>
        </div>

        <div style={{
          fontSize: 32,
          color: COLORS.white,
          maxWidth: 800,
          margin: '0 auto',
          lineHeight: 1.5,
          opacity: interpolate(frame, [150, 200], [0, 1], {extrapolateRight: 'clamp'}),
        }}>
          Demand significant discounts for<br/>
          <span style={{color: COLORS.warningGold, fontWeight: 700}}>secure, sovereign access</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 6: Close with Tagline (v1.1 - Logo only here)
const Scene6Close: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const logoScale = spring({frame: frame - 30, fps, config: {damping: 8}});
  const taglineOpacity = interpolate(frame, [120, 180], [0, 1], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${COLORS.sovereignBlue} 0%, #0052D4 50%, ${COLORS.sovereignBlue} 100%)`,
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{textAlign: 'center'}}>
        {/* SchoolDay Logo - only appears here in v1.1 */}
        <div style={{
          fontSize: 80,
          fontWeight: 800,
          color: COLORS.white,
          marginBottom: 15,
          transform: `scale(${logoScale})`,
          opacity: interpolate(frame, [0, 30], [0, 1], {extrapolateRight: 'clamp'}),
        }}>
          SchoolDay
        </div>

        <div style={{
          fontSize: 24,
          color: '#aaccff',
          marginBottom: 60,
          opacity: interpolate(frame, [30, 60], [0, 1], {extrapolateRight: 'clamp'}),
        }}>
          www.schoolday.com
        </div>

        {/* Tagline: Your Students. Your Data. Your Control. */}
        <div style={{opacity: taglineOpacity}}>
          <div style={{
            fontSize: 56,
            fontWeight: 800,
            color: COLORS.white,
            textShadow: '0 4px 20px rgba(0,0,0,0.3)',
            letterSpacing: 2,
          }}>
            Your Students.
          </div>
          <div style={{
            fontSize: 56,
            fontWeight: 800,
            color: COLORS.warningGold,
            textShadow: '0 4px 20px rgba(0,0,0,0.3)',
            letterSpacing: 2,
            marginTop: 10,
          }}>
            Your Data.
          </div>
          <div style={{
            fontSize: 56,
            fontWeight: 800,
            color: COLORS.protectionGreen,
            textShadow: '0 4px 20px rgba(0,0,0,0.3)',
            letterSpacing: 2,
            marginTop: 10,
          }}>
            Your Control.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Main composition - v1.1 (6 scenes, 122.5 seconds)
export const Main: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {/* Single concatenated voiceover track - Edge TTS v1.1 */}
      <Audio src={staticFile('voiceover/full_voiceover.mp3')} />

      {/* Scene 1: PowerSchool Breach Hook */}
      <Sequence from={SCENES.hook.start} durationInFrames={SCENES.hook.duration}>
        <Scene1Hook />
      </Sequence>

      {/* Scene 2: Data Sovereignty Problem */}
      <Sequence from={SCENES.problem.start} durationInFrames={SCENES.problem.duration}>
        <Scene2Problem />
      </Sequence>

      {/* Scene 3: SchoolDay Solution */}
      <Sequence from={SCENES.solution.start} durationInFrames={SCENES.solution.duration}>
        <Scene3Solution />
      </Sequence>

      {/* Scene 4: Integration */}
      <Sequence from={SCENES.integration.start} durationInFrames={SCENES.integration.duration}>
        <Scene4Integration />
      </Sequence>

      {/* Scene 5: Leverage */}
      <Sequence from={SCENES.leverage.start} durationInFrames={SCENES.leverage.duration}>
        <Scene5Leverage />
      </Sequence>

      {/* Scene 6: Close with Tagline */}
      <Sequence from={SCENES.close.start} durationInFrames={SCENES.close.duration}>
        <Scene6Close />
      </Sequence>
    </AbsoluteFill>
  );
};

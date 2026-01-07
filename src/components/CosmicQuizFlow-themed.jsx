import React, { useState } from 'react';
import { AnuLunarTheme, playAnuTone, playAnuLunarSound } from './AnuLunarTheme';

const CosmicQuizFlow = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [userData, setUserData] = useState({});
  const totalSteps = 7;

  const letterValues = {
    A:1,J:1,S:1,B:2,K:2,T:2,C:3,L:3,U:3,
    D:4,M:4,V:4,E:5,N:5,W:5,F:6,O:6,X:6,
    G:7,P:7,Y:7,H:8,Q:8,Z:8,I:9,R:9
  };
  const vowels = ['A','E','I','O','U'];
  const masterNumbers = [11, 22, 33];

  const reduceToSingle = (num) => {
    while (num > 9 && !masterNumbers.includes(num)) {
      num = String(num).split('').reduce((a,b)=>a+Number(b),0);
    }
    return num;
  };

  const calculateNameNumber = (name, mode=null) => {
    const clean = name.toUpperCase().replace(/[^A-Z]/g,'');
    let sum = 0;
    for (let c of clean) {
      if (!letterValues[c]) continue;
      if (mode === null) sum += letterValues[c];
      if (mode === 'vowel' && vowels.includes(c)) sum += letterValues[c];
      if (mode === 'consonant' && !vowels.includes(c)) sum += letterValues[c];
    }
    return reduceToSingle(sum);
  };

  const calculateLifePath = (date) => {
    if (!date) return null;
    const [y, m, d] = date.split('-').map(Number);
    if (![y, m, d].every(Number.isFinite)) return null;
    return reduceToSingle(reduceToSingle(y) + reduceToSingle(m) + reduceToSingle(d));
  };

  const nextStep = () => {
    // Play step advance sound
    playAnuTone(AnuLunarTheme.sound.tones.stepAdvance);
    setCurrentStep(s => Math.min(s+1, totalSteps+1));
  };

  const prevStep = () => setCurrentStep(s => Math.max(s-1,1));

  const generateBlueprint = () => {
    if (!userData.consent) {
      alert(AnuLunarTheme.voice.languagePatterns.error);
      return;
    }

    const fullName = [userData.firstName, userData.middleName, userData.lastName]
      .filter(Boolean).join(' ');

    const result = {
      ...userData,
      numerology: {
        lifePath: calculateLifePath(userData.birthDate),
        expression: calculateNameNumber(fullName),
        soulUrge: calculateNameNumber(fullName,'vowel')
      }
    };

    // Play completion sound
    playAnuTone(AnuLunarTheme.sound.tones.completion);
    
    setUserData(result);
    console.log('AnuLunar Blueprint Ready', result);
    setCurrentStep(8);
  };

  const baseStyles = {
    fontFamily: AnuLunarTheme.fonts.body,
    background: `radial-gradient(circle at top, ${AnuLunarTheme.colors.deepIndigo} 0%, ${AnuLunarTheme.colors.voidIndigo} 55%)`,
    color: AnuLunarTheme.colors.lunarVeil,
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem'
  };

  const card = {
    maxWidth: 620,
    width: '100%',
    background: AnuLunarTheme.colors.surfaceGlass,
    border: `1px solid ${AnuLunarTheme.colors.surfaceBorder}`,
    borderRadius: AnuLunarTheme.radius.lg,
    padding: AnuLunarTheme.spacing.xl
  };

  const buttonStyle = {
    padding: `${AnuLunarTheme.spacing.sm}px ${AnuLunarTheme.spacing.md}px`,
    borderRadius: AnuLunarTheme.radius.sm,
    border: `1px solid rgba(233,234,241,0.2)`,
    background: AnuLunarTheme.colors.inputBg,
    color: AnuLunarTheme.colors.starAsh,
    fontFamily: AnuLunarTheme.fonts.display,
    letterSpacing: '1px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    textTransform: 'uppercase'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    background: AnuLunarTheme.colors.astralViolet,
    border: `1px solid ${AnuLunarTheme.colors.astralViolet}`,
    color: AnuLunarTheme.colors.lunarVeil
  };

  const inputStyle = {
    width: '100%',
    marginBottom: AnuLunarTheme.spacing.sm,
    padding: '14px',
    borderRadius: AnuLunarTheme.radius.sm,
    background: AnuLunarTheme.colors.inputBg,
    border: `1px solid ${AnuLunarTheme.colors.inputBorder}`,
    color: AnuLunarTheme.colors.lunarVeil,
    fontFamily: AnuLunarTheme.fonts.body,
    outline: 'none'
  };

  return (
    <div style={baseStyles}>
      <div style={card}>

        {/* Progress */}
        <div style={{
          height: 4,
          background: 'rgba(255,255,255,0.08)',
          marginBottom: AnuLunarTheme.spacing.lg
        }}>
          <div style={{
            width: `${(currentStep/totalSteps)*100}%`,
            height: '100%',
            background: `linear-gradient(90deg,${AnuLunarTheme.colors.astralViolet},${AnuLunarTheme.colors.starlightGold})`,
            transition: AnuLunarTheme.motion.progress.duration + ' ' + AnuLunarTheme.motion.progress.easing
          }}/>
        </div>

        {currentStep === 1 && (
          <>
            <p style={{
              ...AnuLunarTheme.textStyles.stepLabel,
              textAlign: 'center'
            }}>ANULUNAR™ SPIRITUAL INTELLIGENCE</p>

            <h2 style={{
              ...AnuLunarTheme.textStyles.heading,
              textAlign: 'center',
              margin: '18px 0'
            }}>
              Blueprint Initialization
            </h2>

            <p style={{
              ...AnuLunarTheme.textStyles.body,
              textAlign: 'center',
              marginBottom: AnuLunarTheme.spacing.lg
            }}>
              {AnuLunarTheme.voice.languagePatterns.welcome}
            </p>

            <button onClick={nextStep} style={primaryButtonStyle}>
              Begin
            </button>
          </>
        )}

        {currentStep === 2 && (
          <>
            <h3 style={{
              ...AnuLunarTheme.textStyles.heading,
              marginBottom: AnuLunarTheme.spacing.md
            }}>Identity Data</h3>

            {['firstName','middleName','lastName'].map((field,i)=>(
              <input
                key={field}
                placeholder={['First Name','Middle Name (optional)','Last Name'][i]}
                value={userData[field]||''}
                onChange={e=>setUserData({...userData,[field]:e.target.value})}
                style={inputStyle}
              />
            ))}

            <div style={{display:'flex',gap:AnuLunarTheme.spacing.sm,marginTop:AnuLunarTheme.spacing.lg}}>
              <button onClick={prevStep} style={buttonStyle}>Back</button>
              <button onClick={nextStep} style={primaryButtonStyle}>Continue</button>
            </div>
          </>
        )}

        {currentStep === 3 && (
          <>
            <h3 style={{
              ...AnuLunarTheme.textStyles.heading,
              marginBottom: AnuLunarTheme.spacing.md
            }}>Contact Information</h3>

            <input
              type="email"
              placeholder="Email Address"
              value={userData.email||''}
              onChange={e=>setUserData({...userData,email:e.target.value})}
              style={inputStyle}
            />

            <div style={{display:'flex',gap:AnuLunarTheme.spacing.sm,marginTop:AnuLunarTheme.spacing.lg}}>
              <button onClick={prevStep} style={buttonStyle}>Back</button>
              <button onClick={nextStep} style={primaryButtonStyle}>Continue</button>
            </div>
          </>
        )}

        {currentStep === 4 && (
          <>
            <h3 style={{
              ...AnuLunarTheme.textStyles.heading,
              marginBottom: AnuLunarTheme.spacing.md
            }}>Birth Date</h3>

            <input
              type="date"
              value={userData.birthDate||''}
              onChange={e=>setUserData({...userData,birthDate:e.target.value})}
              style={inputStyle}
            />

            <div style={{display:'flex',gap:AnuLunarTheme.spacing.sm,marginTop:AnuLunarTheme.spacing.lg}}>
              <button onClick={prevStep} style={buttonStyle}>Back</button>
              <button onClick={nextStep} style={primaryButtonStyle}>Continue</button>
            </div>
          </>
        )}

        {currentStep === 5 && (
          <>
            <h3 style={{
              ...AnuLunarTheme.textStyles.heading,
              marginBottom: AnuLunarTheme.spacing.md
            }}>Birth Time</h3>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: AnuLunarTheme.spacing.sm, marginBottom: AnuLunarTheme.spacing.sm}}>
              <input
                type="number"
                placeholder="Hour"
                min="0"
                max="23"
                value={userData.birthHour||'12'}
                onChange={e=>setUserData({...userData,birthHour:e.target.value})}
                style={{
                  ...inputStyle,
                  marginBottom: 0
                }}
              />
              <input
                type="number"
                placeholder="Min"
                min="0"
                max="59"
                value={userData.birthMinute||'0'}
                onChange={e=>setUserData({...userData,birthMinute:e.target.value})}
                style={{
                  ...inputStyle,
                  marginBottom: 0
                }}
              />
              <select
                value={userData.timezone||'America/Toronto'}
                onChange={e=>setUserData({...userData,timezone:e.target.value})}
                style={{
                  ...inputStyle,
                  marginBottom: 0
                }}
              >
                <option value="America/Toronto">EST</option>
                <option value="America/Los_Angeles">PST</option>
                <option value="America/Chicago">CST</option>
                <option value="America/Denver">MST</option>
                <option value="Europe/London">GMT</option>
                <option value="UTC">UTC</option>
              </select>
            </div>

            <div style={{display:'flex',gap:AnuLunarTheme.spacing.sm,marginTop:AnuLunarTheme.spacing.lg}}>
              <button onClick={prevStep} style={buttonStyle}>Back</button>
              <button onClick={nextStep} style={primaryButtonStyle}>Continue</button>
            </div>
          </>
        )}

        {currentStep === 6 && (
          <>
            <h3 style={{
              ...AnuLunarTheme.textStyles.heading,
              marginBottom: AnuLunarTheme.spacing.md
            }}>Birth Location</h3>

            <input
              placeholder="Birth City"
              value={userData.birthCity||''}
              onChange={e=>setUserData({...userData,birthCity:e.target.value})}
              style={inputStyle}
            />

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: AnuLunarTheme.spacing.sm, marginBottom: AnuLunarTheme.spacing.sm}}>
              <input
                placeholder="Region/State"
                value={userData.birthRegion||''}
                onChange={e=>setUserData({...userData,birthRegion:e.target.value})}
                style={{
                  ...inputStyle,
                  marginBottom: 0
                }}
              />
              <input
                placeholder="Country"
                value={userData.birthCountry||''}
                onChange={e=>setUserData({...userData,birthCountry:e.target.value})}
                style={{
                  ...inputStyle,
                  marginBottom: 0
                }}
              />
            </div>

            <div style={{display:'flex',gap:AnuLunarTheme.spacing.sm,marginTop:AnuLunarTheme.spacing.lg}}>
              <button onClick={prevStep} style={buttonStyle}>Back</button>
              <button onClick={nextStep} style={primaryButtonStyle}>Continue</button>
            </div>
          </>
        )}

        {currentStep === 7 && (
          <>
            <h3 style={{
              ...AnuLunarTheme.textStyles.heading,
              marginBottom: AnuLunarTheme.spacing.md
            }}>Consent</h3>

            <div style={{display:'flex',gap:AnuLunarTheme.spacing.sm,alignItems:'flex-start',marginBottom:AnuLunarTheme.spacing.md}}>
              <input
                type="checkbox"
                checked={userData.consent||false}
                onChange={e=>setUserData({...userData,consent:e.target.checked})}
                style={{marginTop:4,accentColor:AnuLunarTheme.colors.astralViolet}}
              />
              <p style={{
                ...AnuLunarTheme.textStyles.body,
                fontSize: '0.9rem',
                lineHeight: 1.5
              }}>
                {AnuLunarTheme.voice.languagePatterns.consent}
              </p>
            </div>

            <div style={{display:'flex',gap:AnuLunarTheme.spacing.sm,marginTop:AnuLunarTheme.spacing.lg}}>
              <button onClick={prevStep} style={buttonStyle}>Back</button>
              <button onClick={generateBlueprint} style={primaryButtonStyle}>Generate Blueprint</button>
            </div>
          </>
        )}

        {currentStep === 8 && (
          <>
            <div style={{textAlign:'center',marginBottom:AnuLunarTheme.spacing.lg}}>
              <p style={{
                ...AnuLunarTheme.textStyles.stepLabel,
                fontSize: '10px',
                marginBottom: AnuLunarTheme.spacing.xs
              }}>ANULUNAR™ MINI BLUEPRINT</p>
              
              <h3 style={{
                ...AnuLunarTheme.textStyles.heading,
                marginBottom: AnuLunarTheme.spacing.md
              }}>Your Core Numbers</h3>
            </div>

            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(3,1fr)',
              gap: AnuLunarTheme.spacing.sm,
              marginBottom: AnuLunarTheme.spacing.lg
            }}>
              <div style={{
                background: AnuLunarTheme.colors.inputBg,
                border: `1px solid ${AnuLunarTheme.colors.surfaceBorder}`,
                padding: '20px',
                textAlign: 'center',
                borderRadius: AnuLunarTheme.radius.sm
              }}>
                <p style={{
                  ...AnuLunarTheme.textStyles.stepLabel,
                  fontSize: '10px',
                  marginBottom: AnuLunarTheme.spacing.xs
                }}>LIFE PATH</p>
                <p style={{fontSize:'24px',color:AnuLunarTheme.colors.astralViolet,fontWeight:500}}>
                  {userData.numerology?.lifePath || '—'}
                </p>
              </div>
              
              <div style={{
                background: AnuLunarTheme.colors.inputBg,
                border: `1px solid ${AnuLunarTheme.colors.surfaceBorder}`,
                padding: '20px',
                textAlign: 'center',
                borderRadius: AnuLunarTheme.radius.sm
              }}>
                <p style={{
                  ...AnuLunarTheme.textStyles.stepLabel,
                  fontSize: '10px',
                  marginBottom: AnuLunarTheme.spacing.xs
                }}>EXPRESSION</p>
                <p style={{fontSize:'24px',color:AnuLunarTheme.colors.astralViolet,fontWeight:500}}>
                  {userData.numerology?.expression || '—'}
                </p>
              </div>
              
              <div style={{
                background: AnuLunarTheme.colors.inputBg,
                border: `1px solid ${AnuLunarTheme.colors.surfaceBorder}`,
                padding: '20px',
                textAlign: 'center',
                borderRadius: AnuLunarTheme.radius.sm
              }}>
                <p style={{
                  ...AnuLunarTheme.textStyles.stepLabel,
                  fontSize: '10px',
                  marginBottom: AnuLunarTheme.spacing.xs
                }}>SOUL URGE</p>
                <p style={{fontSize:'24px',color:AnuLunarTheme.colors.astralViolet,fontWeight:500}}>
                  {userData.numerology?.soulUrge || '—'}
                </p>
              </div>
            </div>

            <div style={{
              background: `linear-gradient(135deg, rgba(111, 107, 216, 0.1), rgba(214, 179, 106, 0.1))`,
              border: `1px solid rgba(214, 179, 106, 0.2)`,
              borderRadius: AnuLunarTheme.radius.sm,
              padding: '20px',
              marginBottom: AnuLunarTheme.spacing.lg,
              textAlign: 'center'
            }}>
              <h4 style={{color:AnuLunarTheme.colors.starlightGold,marginBottom:AnuLunarTheme.spacing.sm,fontSize:'0.9rem'}}>
                ✦ Cosmic Transmission Complete ✦
              </h4>
              <p style={{
                ...AnuLunarTheme.textStyles.body,
                fontSize: '0.85rem'
              }}>
                Your complete Spiritual Intelligence Blueprint has been transmitted to{' '}
                <span style={{color: AnuLunarTheme.colors.lunarVeil}}>{userData.email}</span>. 
                This includes your Celtic Moon wisdom, birth chart analysis, and LUNARIS™ synthesis.
              </p>
            </div>

            <button 
              onClick={() => setCurrentStep(9)} 
              style={{...primaryButtonStyle, width: '100%'}}
            >
              Continue to Portal
            </button>
          </>
        )}

        {currentStep === 9 && (
          <>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'3rem',color:AnuLunarTheme.colors.starlightGold,marginBottom:AnuLunarTheme.spacing.sm}}>✦</div>
              <h3 style={{
                ...AnuLunarTheme.textStyles.heading,
                marginBottom: AnuLunarTheme.spacing.sm
              }}>Blueprint Archived</h3>
              <p style={{
                ...AnuLunarTheme.textStyles.body,
                marginBottom: AnuLunarTheme.spacing.md
              }}>
                {AnuLunarTheme.voice.languagePatterns.completion}
              </p>
              <button 
                onClick={() => {setCurrentStep(1); setUserData({});}} 
                style={primaryButtonStyle}
              >
                Create Another
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default CosmicQuizFlow;
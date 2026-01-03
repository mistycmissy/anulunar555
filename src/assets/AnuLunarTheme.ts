// AnuLunarTheme.ts
// Canonical theme + voice system for AnuLunar™ Spiritual Intelligence

export const AnuLunarTheme = {
  name: 'AnuLunar™ Spiritual Intelligence',
  version: 'SI-555',

  /* =========================
     COLOR SYSTEM
     ========================= */
  colors: {
    voidIndigo: '#09071f',
    deepIndigo: '#120c2e',
    astralViolet: '#6f6bd8',
    starlightGold: '#d6b36a',
    lunarVeil: '#e9eaf1',
    starAsh: '#a7a9c2',

    surfaceGlass: 'rgba(9,7,31,0.45)',
    surfaceBorder: 'rgba(233,234,241,0.08)',
    inputBg: 'rgba(9,7,31,0.8)',
    inputBorder: 'rgba(255,255,255,0.1)',

    success: '#7fffd4',
    warning: '#d6b36a',
    error: '#ff6b6b'
  },

  /* =========================
     TYPOGRAPHY
     ========================= */
  fonts: {
    display: `'Bank Gothic', 'Arial Narrow', sans-serif`,
    body: `'Aeonik', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
  },

  textStyles: {
    stepLabel: {
      fontFamily: `'Bank Gothic', 'Arial Narrow', sans-serif`,
      letterSpacing: '3px',
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      color: '#a7a9c2'
    },
    heading: {
      fontFamily: `'Bank Gothic', 'Arial Narrow', sans-serif`,
      letterSpacing: '2px',
      textTransform: 'uppercase',
      color: '#6f6bd8'
    },
    body: {
      fontFamily: `'Aeonik', system-ui, sans-serif`,
      fontSize: '0.9rem',
      lineHeight: 1.6,
      color: '#a7a9c2'
    }
  },

  /* =========================
     LAYOUT + SHAPE
     ========================= */
  radius: {
    sm: 8,
    md: 14,
    lg: 22
  },

  spacing: {
    xs: 8,
    sm: 12,
    md: 24,
    lg: 32,
    xl: 48
  },

  shadows: {
    softGlow: '0 0 30px rgba(111,107,216,0.25)'
  },

  /* =========================
     MOTION
     ========================= */
  motion: {
    fadeIn: {
      from: { opacity: 0, transform: 'translateY(18px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
      duration: '0.4s',
      easing: 'ease-out'
    },
    progress: {
      duration: '0.3s',
      easing: 'ease'
    },
    hoverLift: {
      transform: 'translateY(-1px)',
      transition: 'all 0.2s ease'
    }
  },

  /* =========================
     SOUND CUES (OPTIONAL)
     ========================= */
  sound: {
    enabledByDefault: false,
    tones: {
      stepAdvance: '/sounds/anu-soft-chime.mp3',
      completion: '/sounds/anu-gold-chord.mp3'
    }
  },

  /* =========================
     BRAND VOICE
     ========================= */
  voice: {
    tone: [
      'precise',
      'calm',
      'initiatory',
      'non-performative',
      'authoritative without ego'
    ],

    rules: [
      'Never hype, never plead',
      'No fear language',
      'No guru framing',
      'Clarity over mysticism',
      'Ritualized but grounded'
    ],

    languagePatterns: {
      welcome: 'This system collects precise data to generate your Spiritual Intelligence profile.',
      consent: 'Your data is held in reverence and used solely for your reports and aligned invitations.',
      completion: 'Your blueprint has been generated. Further insights will arrive when unlocked.',
      error: 'Something disrupted the transmission. Please review the field and try again.'
    }
  }
};

/* =========================
   HELPER EXPORTS
   ========================= */

export const playAnuTone = (src: string) => {
  try {
    const audio = new Audio(src);
    audio.volume = 0.25;
    audio.play().catch(() => {});
  } catch {
    // silent fail by design
  }
};

// useAnuLunarSound.ts
export function playAnuLunarSound(src: string, volume = 0.25) {
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    audio.play();
  } catch {
    // silent fail by design
  }
}
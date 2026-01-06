const LUNAR_CYCLE_DAYS = 29.53058867
const KNOWN_NEW_MOON = new Date('2000-01-06T18:14:00Z') // reference new moon

const PHASES = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent'
]

const hashToInt = (input) => {
  const str = String(input ?? '')
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}

const pick = (items, seed) => items[seed % items.length]

export const getMoonPhase = (date = new Date()) => {
  const diffMs = date.getTime() - KNOWN_NEW_MOON.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const phase = ((diffDays % LUNAR_CYCLE_DAYS) / LUNAR_CYCLE_DAYS + 1) % 1
  const phaseIndex = Math.floor(phase * 8) % 8

  return {
    name: PHASES[phaseIndex],
    lunarDay: Math.floor(phase * LUNAR_CYCLE_DAYS) + 1
  }
}

export const getDailyMicroInsight = (
  {
    firstName,
    celticMoonSign,
    sunSign,
    lifePath
  } = {},
  date = new Date()
) => {
  const { name: phaseName } = getMoonPhase(date)
  const seed = hashToInt(`${date.toISOString().slice(0, 10)}|${celticMoonSign}|${sunSign}|${lifePath}`)

  const openers = [
    'Today asks for honesty, not speed.',
    'Today is quieter than it looks.',
    'Today is a threshold day.',
    'Today wants one clean choice.'
  ]

  const phaseLines = {
    'New Moon': [
      'Start small. Let the first step be private.',
      'Plant the intention before you explain it.',
      'Name what you want, then protect it.'
    ],
    'Waxing Crescent': [
      'Follow the thread that keeps returning.',
      'Try it once, gently. That is enough.',
      'Let curiosity lead. Perfection can wait.'
    ],
    'First Quarter': [
      'Choose one boundary and hold it.',
      'Decide, then stop re-deciding.',
      'Do the brave thing in a small way.'
    ],
    'Waxing Gibbous': [
      'Refine, don’t restart.',
      'Make it clearer, not bigger.',
      'Ask for what would make this easier.'
    ],
    'Full Moon': [
      'Let what’s true be seen.',
      'Release what you’ve been carrying alone.',
      'Celebrate the progress you kept minimizing.'
    ],
    'Waning Gibbous': [
      'Share what you learned. Keep it simple.',
      'Forgive the version of you that didn’t know yet.',
      'Close a loop that’s been draining you.'
    ],
    'Last Quarter': [
      'Cut what’s noisy. Keep what’s real.',
      'Finish one thing you’ve been avoiding.',
      'Let “no” be devotional today.'
    ],
    'Waning Crescent': [
      'Rest is part of the work.',
      'Let the day be softer than your standards.',
      'Make space. Something wants to arrive.'
    ]
  }

  const identityLines = [
    celticMoonSign ? `Your Celtic Moon (${celticMoonSign}) is awake in the background.` : null,
    sunSign ? `Your Sun (${sunSign}) wants you to stay true to your center.` : null,
    lifePath ? `Life Path ${lifePath}: don’t abandon the lesson for the shortcut.` : null
  ].filter(Boolean)

  const addressedName = firstName ? `${firstName}, ` : ''
  const identity = identityLines.length ? ` ${pick(identityLines, seed + 7)}` : ''

  return `${addressedName}${pick(openers, seed)} ${pick(phaseLines[phaseName] || phaseLines['New Moon'], seed + 3)}${identity}`
}

export const getWeeklyTheme = ({ celticMoonSign } = {}, date = new Date()) => {
  const { name: phaseName } = getMoonPhase(date)
  const seed = hashToInt(`${date.toISOString().slice(0, 10)}|weekly|${celticMoonSign}`)

  const themesByPhase = {
    'New Moon': ['Begin again', 'Private intention', 'Clean slate'],
    'Waxing Crescent': ['Gentle momentum', 'Trust the thread', 'Small brave steps'],
    'First Quarter': ['Boundaries', 'Decision', 'Courage in practice'],
    'Waxing Gibbous': ['Refinement', 'Clarity', 'Preparation'],
    'Full Moon': ['Revelation', 'Release', 'Celebration'],
    'Waning Gibbous': ['Integration', 'Gratitude', 'Teach what you learned'],
    'Last Quarter': ['Editing', 'Completion', 'Truth over noise'],
    'Waning Crescent': ['Restoration', 'Surrender', 'Quiet closure']
  }

  const theme = pick(themesByPhase[phaseName] || themesByPhase['New Moon'], seed)
  return { phaseName, theme }
}


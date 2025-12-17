// =============================================
// AnuLunar Swiss Ephemeris Integration
// Backend API Functions
// =============================================

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// =============================================
// Swiss Ephemeris Input Object Generator
// =============================================
export function createSwissEphemerisInput(profileData) {
  const {
    profile_id,
    birth_date,
    birth_hour = 12, // Default noon if unknown
    birth_minute = 0,
    birth_timezone,
    birth_latitude,
    birth_longitude
  } = profileData;

  // Calculate UTC datetime with proper timezone handling
  const birthDateTime = new Date(`${birth_date}T${String(birth_hour).padStart(2, '0')}:${String(birth_minute).padStart(2, '0')}:00`);
  
  // Convert to UTC based on timezone
  const utcDateTime = new Date(birthDateTime.toLocaleString("en-US", { timeZone: birth_timezone }));

  // Backend contract for Swiss Ephemeris service
  return {
    profile_id: profile_id,
    utc_datetime: utcDateTime.toISOString(),
    latitude: birth_latitude,
    longitude: birth_longitude,
    house_system: "Placidus",
    zodiac_system: "Tropical",
    requested_planets: [
      "Sun",
      "Moon", 
      "Mercury",
      "Venus",
      "Mars",
      "Jupiter",
      "Saturn",
      "Uranus",
      "Neptune",
      "Pluto"
    ]
  };
}

// =============================================
// Profile Creation & Report Generation Flow
// =============================================
export async function processAnuLunarIntake(intakeData) {
  try {
    const {
      email,
      first_name,
      middle_name,
      last_name,
      birth_date,
      birth_hour,
      birth_minute,
      birth_timezone,
      birth_location, // "City, Province/State, Country"
      consent
    } = intakeData;

    // Step 1: Create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([{
        email,
        first_name,
        middle_name,
        last_name,
        birth_date,
        birth_hour,
        birth_minute,
        birth_timezone,
        birth_latitude: null, // Will be geocoded later
        birth_longitude: null,
        consent
      }])
      .select()
      .single();

    if (profileError) throw profileError;

    // Step 2: Generate numerology report immediately
    const numerologyData = calculateNumerology(first_name, last_name, birth_date);
    
    const { data: numerologyReport, error: numerologyError } = await supabase
      .from('numerology_reports')
      .insert([{
        profile_id: profile.id,
        ...numerologyData
      }])
      .select()
      .single();

    if (numerologyError) throw numerologyError;

    // Step 3: Create astrology input for background processing
    const { data: astrologyInput, error: astrologyError } = await supabase
      .rpc('create_astrology_input', {
        p_profile_id: profile.id,
        p_birth_date: birth_date,
        p_birth_hour: birth_hour,
        p_birth_minute: birth_minute,
        p_birth_timezone: birth_timezone,
        p_latitude: null, // Will geocode birth_location
        p_longitude: null
      });

    if (astrologyError) console.warn('Astrology input creation failed:', astrologyError);

    // Step 4: Queue location geocoding
    if (birth_location) {
      queueLocationGeocoding(profile.id, birth_location);
    }

    // Step 5: Generate Celtic Moon Sign
    const celticMoonData = calculateCelticMoonSign(birth_date);
    
    const { data: celticReport, error: celticError } = await supabase
      .from('celtic_moon_reports')
      .insert([{
        profile_id: profile.id,
        ...celticMoonData
      }])
      .select()
      .single();

    if (celticError) console.warn('Celtic moon report creation failed:', celticError);

    return {
      status: "success",
      profile_id: profile.id,
      reports: {
        numerology: "ready",
        astrology: "pending",
        celtic_moon: "ready"
      },
      immediate_insights: {
        numerology: numerologyReport,
        celtic_moon: celticReport
      }
    };

  } catch (error) {
    console.error('AnuLunar intake processing failed:', error);
    return {
      status: "error",
      message: error.message
    };
  }
}

// =============================================
// Numerology Calculation Engine
// =============================================
function calculateNumerology(firstName, lastName, birthDate) {
  const fullName = `${firstName} ${lastName}`.toUpperCase();
  
  // Letter to number mapping (Pythagorean)
  const letterValues = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
    J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
    S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8
  };

  function reduceToSingle(num) {
    // Keep master numbers (11, 22, 33)
    if ([11, 22, 33].includes(num)) return num;
    
    while (num > 9) {
      num = num.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
    }
    return num;
  }

  function calculateNameNumber(name) {
    const cleanName = name.replace(/[^A-Z]/g, '');
    const sum = cleanName.split('').reduce((total, letter) => {
      return total + (letterValues[letter] || 0);
    }, 0);
    return reduceToSingle(sum);
  }

  function calculateVowelNumber(name) {
    const vowels = name.match(/[AEIOU]/g) || [];
    const sum = vowels.reduce((total, vowel) => total + letterValues[vowel], 0);
    return reduceToSingle(sum);
  }

  function calculateConsonantNumber(name) {
    const consonants = name.replace(/[AEIOU\s]/g, '');
    const sum = consonants.split('').reduce((total, consonant) => {
      return total + (letterValues[consonant] || 0);
    }, 0);
    return reduceToSingle(sum);
  }

  function calculateLifePath(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    const sum = day + month + year;
    return reduceToSingle(sum);
  }

  // Calculate all core numbers
  const lifePath = calculateLifePath(birthDate);
  const expression = calculateNameNumber(fullName);
  const soulUrge = calculateVowelNumber(fullName);
  const personality = calculateConsonantNumber(fullName);
  const birthday = reduceToSingle(new Date(birthDate).getDate());
  const maturity = reduceToSingle(lifePath + expression);

  return {
    life_path: lifePath,
    expression: expression,
    soul_urge: soulUrge,
    personality: personality,
    birthday: birthday,
    maturity: maturity,
    spiritual_interpretation: generateNumerologyInsights(lifePath, expression, soulUrge)
  };
}

// =============================================
// Celtic Moon Sign Calculation
// =============================================
function calculateCelticMoonSign(birthDate) {
  const date = new Date(birthDate);
  const month = date.getMonth() + 1; // 1-based month
  const day = date.getDate();

  // Celtic Tree Calendar (13 signs)
  const celticSigns = {
    'Birch': { start: [12, 24], end: [1, 20], ogham: 'ᚁ', themes: ['Rebirth', 'New Beginnings', 'Purification'] },
    'Rowan': { start: [1, 21], end: [2, 17], ogham: 'ᚂ', themes: ['Vision', 'Protection', 'Intuition'] },
    'Ash': { start: [2, 18], end: [3, 17], ogham: 'ᚅ', themes: ['Connection', 'Intuition', 'Prophetic Dreams'] },
    'Alder': { start: [3, 18], end: [4, 14], ogham: 'ᚃ', themes: ['Guidance', 'Protection', 'Decisiveness'] },
    'Willow': { start: [4, 15], end: [5, 12], ogham: 'ᚄ', themes: ['Intuition', 'Cycles', 'Healing'] },
    'Hawthorn': { start: [5, 13], end: [6, 9], ogham: 'ᚆ', themes: ['Protection', 'Hope', 'Healing'] },
    'Oak': { start: [6, 10], end: [7, 7], ogham: 'ᚇ', themes: ['Strength', 'Endurance', 'Leadership'] },
    'Holly': { start: [7, 8], end: [8, 4], ogham: 'ᚈ', themes: ['Protection', 'Overcoming', 'Balance'] },
    'Hazel': { start: [8, 5], end: [9, 1], ogham: 'ᚉ', themes: ['Wisdom', 'Creativity', 'Arts'] },
    'Vine': { start: [9, 2], end: [9, 29], ogham: 'ᚋ', themes: ['Prophecy', 'Exhilaration', 'Wrath'] },
    'Ivy': { start: [9, 30], end: [10, 27], ogham: 'ᚌ', themes: ['Loyalty', 'Faith', 'Friendship'] },
    'Reed': { start: [10, 28], end: [11, 24], ogham: 'ᚅᚌ', themes: ['Surprise', 'Rhetorical Skill', 'Music'] },
    'Elder': { start: [11, 25], end: [12, 23], ogham: 'ᚏ', themes: ['Transition', 'Evolution', 'Regeneration'] }
  };

  // Find matching Celtic sign
  for (const [signName, signData] of Object.entries(celticSigns)) {
    const [startMonth, startDay] = signData.start;
    const [endMonth, endDay] = signData.end;

    // Handle year-end wrap (Birch)
    if (startMonth > endMonth) {
      if ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay)) {
        return {
          celtic_tree_sign: signName,
          ogham_symbol: signData.ogham,
          seasonal_energy: getSeasonalEnergy(signName),
          traditional_themes: signData.themes,
          spiritual_guidance: generateCelticGuidance(signName)
        };
      }
    } else {
      if ((month === startMonth && day >= startDay) || 
          (month === endMonth && day <= endDay) ||
          (month > startMonth && month < endMonth)) {
        return {
          celtic_tree_sign: signName,
          ogham_symbol: signData.ogham,
          seasonal_energy: getSeasonalEnergy(signName),
          traditional_themes: signData.themes,
          spiritual_guidance: generateCelticGuidance(signName)
        };
      }
    }
  }

  // Default fallback
  return {
    celtic_tree_sign: 'Oak',
    ogham_symbol: 'ᚇ',
    seasonal_energy: 'Summer Solstice',
    traditional_themes: ['Strength', 'Endurance', 'Leadership'],
    spiritual_guidance: generateCelticGuidance('Oak')
  };
}

// =============================================
// Helper Functions
// =============================================
function getSeasonalEnergy(treeSign) {
  const seasonalMap = {
    'Birch': 'Winter Solstice Rebirth',
    'Rowan': 'Imbolc Protection',
    'Ash': 'Spring Equinox Intuition',
    'Alder': 'Spring Growth',
    'Willow': 'Beltane Healing',
    'Hawthorn': 'Late Spring Fertility',
    'Oak': 'Summer Solstice Strength',
    'Holly': 'Midsummer Balance',
    'Hazel': 'Lughnasadh Wisdom',
    'Vine': 'Autumn Equinox Prophecy',
    'Ivy': 'Samhain Loyalty',
    'Reed': 'Deep Autumn Transformation',
    'Elder': 'Winter Solstice Evolution'
  };
  return seasonalMap[treeSign] || 'Seasonal Harmony';
}

function generateNumerologyInsights(lifePath, expression, soulUrge) {
  // This would connect to your LUNARIS™ framework
  return {
    core_message: `Your Life Path ${lifePath} combined with Expression ${expression} creates a unique spiritual frequency.`,
    spiritual_gifts: [`Life Path ${lifePath} mastery`, `Expression ${expression} creativity`],
    integration_practice: `Focus on aligning your Life Path ${lifePath} energy with your Soul Urge ${soulUrge} desires.`
  };
}

function generateCelticGuidance(treeSign) {
  // This would integrate with your Celtic Moon Signs database
  return {
    wisdom_message: `The ${treeSign} tree holds ancient wisdom for your spiritual journey.`,
    daily_practice: `Connect with ${treeSign} energy through meditation and nature connection.`,
    lunar_ritual: `Honor the ${treeSign} moon cycles for deeper spiritual alignment.`
  };
}

// =============================================
// Background Processing Functions
// =============================================
async function queueLocationGeocoding(profileId, locationString) {
  // This would integrate with a geocoding service
  // For now, we'll use a placeholder
  console.log(`Queuing geocoding for profile ${profileId}: ${locationString}`);
  
  // TODO: Implement actual geocoding and update birth coordinates
}

export {
  processAnuLunarIntake,
  createSwissEphemerisInput,
  calculateNumerology,
  calculateCelticMoonSign
};
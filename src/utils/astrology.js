// Zodiac Sign Calculator
export const calculateZodiacSign = (birthDate) => {
  const date = new Date(birthDate)
  const month = date.getMonth() + 1
  const day = date.getDate()

  const zodiacSigns = [
    { name: 'Capricorn', start: [12, 22], end: [1, 19], element: 'Earth', modality: 'Cardinal', ruler: 'Saturn', traits: 'Ambitious, disciplined, responsible, practical' },
    { name: 'Aquarius', start: [1, 20], end: [2, 18], element: 'Air', modality: 'Fixed', ruler: 'Uranus', traits: 'Independent, humanitarian, innovative, unconventional' },
    { name: 'Pisces', start: [2, 19], end: [3, 20], element: 'Water', modality: 'Mutable', ruler: 'Neptune', traits: 'Compassionate, intuitive, artistic, empathetic' },
    { name: 'Aries', start: [3, 21], end: [4, 19], element: 'Fire', modality: 'Cardinal', ruler: 'Mars', traits: 'Courageous, confident, enthusiastic, impulsive' },
    { name: 'Taurus', start: [4, 20], end: [5, 20], element: 'Earth', modality: 'Fixed', ruler: 'Venus', traits: 'Reliable, patient, practical, devoted, stable' },
    { name: 'Gemini', start: [5, 21], end: [6, 20], element: 'Air', modality: 'Mutable', ruler: 'Mercury', traits: 'Curious, adaptable, communicative, versatile' },
    { name: 'Cancer', start: [6, 21], end: [7, 22], element: 'Water', modality: 'Cardinal', ruler: 'Moon', traits: 'Nurturing, protective, emotional, intuitive' },
    { name: 'Leo', start: [7, 23], end: [8, 22], element: 'Fire', modality: 'Fixed', ruler: 'Sun', traits: 'Confident, creative, generous, warm-hearted' },
    { name: 'Virgo', start: [8, 23], end: [9, 22], element: 'Earth', modality: 'Mutable', ruler: 'Mercury', traits: 'Analytical, practical, diligent, modest' },
    { name: 'Libra', start: [9, 23], end: [10, 22], element: 'Air', modality: 'Cardinal', ruler: 'Venus', traits: 'Diplomatic, balanced, social, gracious' },
    { name: 'Scorpio', start: [10, 23], end: [11, 21], element: 'Water', modality: 'Fixed', ruler: 'Pluto', traits: 'Passionate, resourceful, intense, determined' },
    { name: 'Sagittarius', start: [11, 22], end: [12, 21], element: 'Fire', modality: 'Mutable', ruler: 'Jupiter', traits: 'Optimistic, adventurous, philosophical, honest' },
  ]

  for (const sign of zodiacSigns) {
    const [startMonth, startDay] = sign.start
    const [endMonth, endDay] = sign.end

    if (startMonth > endMonth) {
      // Year transition
      if ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay)) {
        return sign
      }
    } else {
      if ((month === startMonth && day >= startDay && month === endMonth && day <= endDay) ||
          (month === startMonth && day >= startDay && endMonth > startMonth) ||
          (month === endMonth && day <= endDay && endMonth > startMonth) ||
          (month > startMonth && month < endMonth)) {
        return sign
      }
    }
  }

  return zodiacSigns[0]
}

// Celtic Moon Sign Calculator (13 lunar months)
import { getBirthDateParts } from './birthDate'

export const calculateCelticMoonSign = (birthDate) => {
  const parts = getBirthDateParts(birthDate)
  if (!parts) return null
  const { month, day } = parts

  const celticSigns = [
    { name: 'Birch', start: [12, 24], end: [1, 20], traits: 'New beginnings, purification, rebirth', element: 'Air' },
    { name: 'Rowan', start: [1, 21], end: [2, 17], traits: 'Protection, vision, insight', element: 'Fire' },
    { name: 'Ash', start: [2, 18], end: [3, 17], traits: 'Enchantment, dreams, intuition', element: 'Water' },
    { name: 'Alder', start: [3, 18], end: [4, 14], traits: 'Foundation, courage, strength', element: 'Fire' },
    { name: 'Willow', start: [4, 15], end: [5, 12], traits: 'Intuition, emotions, cycles', element: 'Water' },
    { name: 'Hawthorn', start: [5, 13], end: [6, 9], traits: 'Cleansing, protection, fertility', element: 'Fire' },
    { name: 'Oak', start: [6, 10], end: [7, 7], traits: 'Strength, endurance, nobility', element: 'Earth' },
    { name: 'Holly', start: [7, 8], end: [8, 4], traits: 'Balance, unity, warrior spirit', element: 'Fire' },
    { name: 'Hazel', start: [8, 5], end: [9, 1], traits: 'Wisdom, knowledge, inspiration', element: 'Air' },
    { name: 'Vine', start: [9, 2], end: [9, 29], traits: 'Harvest, celebration, prophecy', element: 'Water' },
    { name: 'Ivy', start: [9, 30], end: [10, 27], traits: 'Determination, survival, connection', element: 'Earth' },
    { name: 'Reed', start: [10, 28], end: [11, 24], traits: 'Truth, harmony, ancestors', element: 'Water' },
    { name: 'Elder', start: [11, 25], end: [12, 23], traits: 'Completion, transformation, renewal', element: 'Air' },
  ]

  for (const sign of celticSigns) {
    const [startMonth, startDay] = sign.start
    const [endMonth, endDay] = sign.end

    // Handle year-crossing signs (Birch)
    if (startMonth > endMonth) {
      if ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay)) {
        return sign
      }
    } else if (startMonth === endMonth) {
      // Handle signs within the same month (Vine)
      if (month === startMonth && day >= startDay && day <= endDay) {
        return sign
      }
    } else {
      // Handle signs spanning multiple months
      if (month === startMonth && day >= startDay) {
        return sign
      } else if (month === endMonth && day <= endDay) {
        return sign
      } else if (month > startMonth && month < endMonth) {
        return sign
      }
    }
  }

  return celticSigns[0] // Default to Birch
}

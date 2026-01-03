// Chakra Analysis based on birth date and name
import { getBirthDateParts } from './birthDate'

export const analyzeChakras = (birthDate, fullName) => {
  const parts = getBirthDateParts(birthDate)
  const dayOfMonth = parts?.day ?? 1
  const nameLength = fullName.replace(/[^A-Za-z]/g, '').length

  const chakras = [
    {
      name: 'Root Chakra',
      sanskrit: 'Muladhara',
      color: 'Red',
      location: 'Base of spine',
      element: 'Earth',
      focus: 'Grounding, survival, security, stability',
      affirmation: 'I am grounded and secure'
    },
    {
      name: 'Sacral Chakra',
      sanskrit: 'Svadhisthana',
      color: 'Orange',
      location: 'Lower abdomen',
      element: 'Water',
      focus: 'Creativity, sexuality, emotions, pleasure',
      affirmation: 'I embrace my creativity and passion'
    },
    {
      name: 'Solar Plexus Chakra',
      sanskrit: 'Manipura',
      color: 'Yellow',
      location: 'Upper abdomen',
      element: 'Fire',
      focus: 'Personal power, confidence, will, self-esteem',
      affirmation: 'I am confident and powerful'
    },
    {
      name: 'Heart Chakra',
      sanskrit: 'Anahata',
      color: 'Green',
      location: 'Center of chest',
      element: 'Air',
      focus: 'Love, compassion, forgiveness, relationships',
      affirmation: 'I give and receive love freely'
    },
    {
      name: 'Throat Chakra',
      sanskrit: 'Vishuddha',
      color: 'Blue',
      location: 'Throat',
      element: 'Sound/Ether',
      focus: 'Communication, self-expression, truth',
      affirmation: 'I speak my truth with clarity'
    },
    {
      name: 'Third Eye Chakra',
      sanskrit: 'Ajna',
      color: 'Indigo',
      location: 'Forehead between eyes',
      element: 'Light',
      focus: 'Intuition, wisdom, imagination, insight',
      affirmation: 'I trust my intuition and inner wisdom'
    },
    {
      name: 'Crown Chakra',
      sanskrit: 'Sahasrara',
      color: 'Violet/White',
      location: 'Top of head',
      element: 'Cosmic Energy',
      focus: 'Spiritual connection, enlightenment, divine consciousness',
      affirmation: 'I am one with the universe'
    }
  ]

  // Determine dominant chakra based on birth day
  const dominantIndex = (dayOfMonth % 7)
  const secondaryIndex = (nameLength % 7)

  return {
    dominant: chakras[dominantIndex],
    secondary: chakras[secondaryIndex],
    all: chakras,
    balance: calculateChakraBalance(dayOfMonth, nameLength)
  }
}

const calculateChakraBalance = (day, nameLength) => {
  const total = day + nameLength
  const balanced = total % 3

  if (balanced === 0) {
    return {
      level: 'Harmonious',
      description: 'Your chakras show natural harmony. Focus on maintaining this balance through regular practice.'
    }
  } else if (balanced === 1) {
    return {
      level: 'Dynamic',
      description: 'Your energy flows actively between chakras. Channel this dynamism into creative pursuits.'
    }
  } else {
    return {
      level: 'Transformative',
      description: 'You are in a period of energetic transformation. Embrace change and spiritual growth.'
    }
  }
}

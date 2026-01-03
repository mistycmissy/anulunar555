// Simple Human Design Type Calculator (based on birth date)
// Note: Full Human Design requires exact birth time and location
import { getBirthDayOfYear } from './birthDate'

export const calculateHumanDesignType = (birthDate) => {
  const dayOfYear = getBirthDayOfYear(birthDate) ?? 1
  
  // Simplified calculation based on day of year
  const types = [
    { 
      name: 'Manifestor',
      percentage: 9,
      strategy: 'Initiate and Inform',
      description: 'Natural initiators with powerful auras. You are here to make things happen and impact others.',
      traits: 'Independent, impactful, initiating, powerful'
    },
    {
      name: 'Generator',
      percentage: 37,
      strategy: 'Wait to Respond',
      description: 'Life force energy builders. You are here to find satisfaction through responding to life.',
      traits: 'Sustainable energy, responsive, building, satisfying work'
    },
    {
      name: 'Manifesting Generator',
      percentage: 33,
      strategy: 'Wait to Respond, then Inform',
      description: 'Multi-passionate and efficient. You are here to respond and move quickly through life.',
      traits: 'Multi-tasking, efficient, responsive, dynamic'
    },
    {
      name: 'Projector',
      percentage: 20,
      strategy: 'Wait for Invitation',
      description: 'Natural guides and managers. You are here to guide others and be recognized.',
      traits: 'Guiding, managing, insightful, recognition-seeking'
    },
    {
      name: 'Reflector',
      percentage: 1,
      strategy: 'Wait a Lunar Cycle',
      description: 'Mirrors of community. You are here to reflect the health of your environment.',
      traits: 'Rare, reflective, sampling, community-oriented'
    }
  ]

  // Simple distribution based on day of year
  if (dayOfYear % 100 < 9) return types[0]  // Manifestor
  if (dayOfYear % 100 < 46) return types[1] // Generator
  if (dayOfYear % 100 < 79) return types[2] // Manifesting Generator
  if (dayOfYear % 100 < 99) return types[3] // Projector
  return types[4] // Reflector
}

export const calculateHumanDesignAuthority = (type) => {
  const authorities = {
    'Manifestor': 'Emotional or Splenic',
    'Generator': 'Sacral or Emotional',
    'Manifesting Generator': 'Sacral or Emotional',
    'Projector': 'Emotional, Splenic, or Ego',
    'Reflector': 'Lunar (wait 28 days)'
  }

  return authorities[type] || 'Emotional'
}

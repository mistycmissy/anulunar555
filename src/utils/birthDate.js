// Shared birth-date parsing utilities.
//
// Important: DO NOT use `new Date("YYYY-MM-DD")` for app calculations.
// JavaScript treats that string as UTC midnight, then local-time getters can shift
// the calendar date depending on the user's timezone.

export const getBirthDateParts = (birthDate) => {
  // Prefer strict parsing of "YYYY-MM-DD" (from <input type="date">).
  if (typeof birthDate === 'string') {
    const datePart = birthDate.split('T')[0] // tolerate ISO strings
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart)
    if (!match) return null

    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])

    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
    if (month < 1 || month > 12) return null
    if (day < 1 || day > 31) return null

    return { year, month, day }
  }

  // Fallback for Date instances: use UTC getters to avoid locale offsets.
  if (birthDate instanceof Date && !Number.isNaN(birthDate.getTime())) {
    return {
      year: birthDate.getUTCFullYear(),
      month: birthDate.getUTCMonth() + 1,
      day: birthDate.getUTCDate(),
    }
  }

  return null
}

export const getBirthDayOfYear = (birthDate) => {
  const parts = getBirthDateParts(birthDate)
  if (!parts) return null

  const { year, month, day } = parts
  const utc = Date.UTC(year, month - 1, day)
  const utcStart = Date.UTC(year, 0, 0)
  return Math.floor((utc - utcStart) / 86400000)
}


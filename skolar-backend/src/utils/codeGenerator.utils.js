export function generateInstitutionCode(type, existingCount) {
  const prefix = type === 'school' ? 'SKL' : 'CLG'
  const year = new Date().getFullYear()
  const num = String(existingCount + 1).padStart(3, '0')
  return `${prefix}-${year}-${num}`
}

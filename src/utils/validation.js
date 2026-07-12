export function validateAssessment(client, consent) {
  const errors = {}
  const name = String(client?.name ?? '').trim()
  const age = Number(client?.age)

  if (!name) errors.name = 'Enter the client name.'
  if (!Number.isInteger(age) || age < 60 || age > 120) {
    errors.age = 'Enter an age from 60 to 120.'
  }
  if (!consent) errors.consent = 'Consent is required before saving.'

  return { valid: Object.keys(errors).length === 0, errors }
}

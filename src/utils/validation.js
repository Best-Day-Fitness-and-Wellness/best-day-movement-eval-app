export function validateAssessment(client, consent) {
  const errors = {}
  const name = String(client?.name ?? '').trim()
  const age = Number(client?.age)

  if (!name) errors.name = 'Enter the client name.'
  if (!Number.isInteger(age) || age < 60 || age > 120) {
    errors.age = 'Enter an age from 60 to 120.'
  }
  if (typeof consent === 'object' && consent !== null) {
    if (!consent.acknowledged || !consent.signed || !String(consent.signerName ?? '').trim() || !consent.signatureData) {
      errors.consent = 'Read and sign the exercise release before continuing.'
    }
  } else if (!consent) {
    errors.consent = 'Consent is required before saving.'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

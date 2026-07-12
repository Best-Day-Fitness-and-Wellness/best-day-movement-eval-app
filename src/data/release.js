export const RELEASE_VERSION = 'movement-release-v1'

export const RELEASE_TEXT = `Best Day Fitness Movement Evaluation & Exercise Participation Acknowledgment

I understand that movement evaluations and exercise activities may involve risks, including muscle soreness, strains, sprains, falls, dizziness, fainting, aggravation of an existing condition, serious injury, or, in rare cases, death.

I confirm that I have shared relevant health conditions, injuries, medications, symptoms, and physical limitations with Best Day Fitness to the best of my knowledge. I understand that I should consult a qualified healthcare professional before participating if I have concerns about my ability to exercise.

I understand that Best Day Fitness and its trainers provide fitness instruction and movement assessment, not medical diagnosis or treatment. I agree to follow instructions, use equipment appropriately, and immediately stop and notify the trainer if I experience pain, chest discomfort, unusual shortness of breath, dizziness, faintness, or any other concerning symptom.

I voluntarily choose to participate and agree to inform Best Day Fitness if my health or ability to exercise changes.

I authorize Best Day Fitness to record this evaluation, notes, signature, and results in my client profile for assessment, exercise-program planning, scheduling, and recordkeeping.

To the extent permitted by applicable law, I release and hold harmless Best Day Fitness, its owners, employees, contractors, and trainers from claims arising from my participation, except for claims that cannot legally be released.

I have read and understand this acknowledgment. I have had an opportunity to ask questions, and I am signing voluntarily.

Electronic signature: My signature below represents my agreement to this acknowledgment.`

export function createConsent() {
  return {
    acknowledged: false,
    signed: false,
    signerName: '',
    signedAt: '',
    releaseVersion: RELEASE_VERSION,
    signatureData: '',
  }
}

export function normalizeConsent(value) {
  if (value && typeof value === 'object') return { ...createConsent(), ...value }
  if (value === true) return { ...createConsent(), acknowledged: true }
  return createConsent()
}

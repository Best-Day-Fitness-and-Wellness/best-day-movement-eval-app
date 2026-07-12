import test from 'node:test'
import assert from 'node:assert/strict'
import { validateAssessment } from '../src/utils/validation.js'

test('rejects an assessment without client name, senior age, or consent', () => {
  const result = validateAssessment({ name: '', age: '' }, false)

  assert.equal(result.valid, false)
  assert.deepEqual(result.errors, {
    name: 'Enter the client name.',
    age: 'Enter an age from 60 to 120.',
    consent: 'Consent is required before saving.',
  })
})

test('accepts a complete senior assessment header', () => {
  const result = validateAssessment({ name: 'Alice Test', age: '70' }, true)

  assert.deepEqual(result, { valid: true, errors: {} })
})

test('requires a named signature and acknowledgment before saving', () => {
  const result = validateAssessment({ name: 'Alice Test', age: '70' }, {
    acknowledged: true,
    signed: false,
    signerName: 'Alice Test',
    signatureData: '',
  })

  assert.equal(result.valid, false)
  assert.equal(result.errors.consent, 'Read and sign the exercise release before continuing.')
})

test('accepts a complete signed release', () => {
  const result = validateAssessment({ name: 'Alice Test', age: '70' }, {
    acknowledged: true,
    signed: true,
    signerName: 'Alice Test',
    signatureData: 'data:image/png;base64,signature',
  })

  assert.equal(result.errors.consent, undefined)
})

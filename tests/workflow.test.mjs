import test from 'node:test'
import assert from 'node:assert/strict'
import { assessmentSteps, clampStep } from '../src/utils/workflow.js'

test('defines the guided tablet workflow without the removed vitals step', () => {
  assert.deepEqual(assessmentSteps.map(step => step.label), [
    'Client Setup',
    'Flexibility & Balance',
    'Endurance & Strength',
    'Function & Core',
    'Review & Save',
  ])
})

test('clamps a restored draft step to the workflow bounds', () => {
  assert.equal(clampStep(-1), 0)
  assert.equal(clampStep(99), assessmentSteps.length - 1)
})

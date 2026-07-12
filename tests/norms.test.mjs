import test from 'node:test'
import assert from 'node:assert/strict'
import { getNormComparisons, getNormScore } from '../src/utils/scoring.js'

test('compares recorded results with the client age and sex norms', () => {
  const comparisons = getNormComparisons({ st: 101, sts: 15, gR: 100 }, 65, 'M')

  assert.deepEqual(comparisons.map(item => [item.label, item.average, item.meets]), [
    ['2-Min Steps', 101, true],
    ['Sit to Stand', 16, false],
    ['Grip R', 91.1, true],
  ])
  assert.deepEqual(getNormScore(comparisons), { score: 67, met: 2, compared: 3 })
})

test('uses female norms for the same age range', () => {
  const steps = getNormComparisons({ st: 93 }, 65, 'F')
  assert.equal(steps[0].average, 93)
  assert.equal(steps[0].meets, true)
})

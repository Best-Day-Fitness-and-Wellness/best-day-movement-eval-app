import test from 'node:test'
import assert from 'node:assert/strict'
import { getBarData, getRisks } from '../src/utils/scoring.js'

const emptyResults = {
  na: '', sR: '', sL: '', aV: '', aD: '',
  oR: '', oL: '', vT: '', vN: '', tug: '', tE: '', tEC: '', st: '',
  gR: '', gL: '', cR: '', cL: '', sts: '', plk: '', cu: '', be: '',
  jmp: '', gnd: '',
}

function riskByLabel(results, label) {
  return getRisks({ ...emptyResults, ...results }, 70, 'M').find(r => r.label === label)
}

test('counts zero calf raises as a measured risk', () => {
  assert.equal(riskByLabel({ cR: 0, cL: 0 }, 'Calf Raises (<25)').level, 'risk')
})

test('does not flag a bilateral metric until both sides are recorded', () => {
  assert.equal(riskByLabel({ cR: 30, cL: '' }, 'Calf Raises (<25)').level, 'none')
})

test('counts a zero back-scratch gap as a measured safe result', () => {
  assert.equal(riskByLabel({ sR: 0, sL: 0 }, 'Shoulder Flexibility').level, 'safe')
})

test('keeps a zero one-leg result visible in chart data', () => {
  const chartRow = getBarData({ ...emptyResults, oR: 0, oL: '' }, 70, 'M')
    .find(row => row.label === 'One Leg (best)')
  assert.equal(chartRow.value, 0)
  assert.equal(chartRow.risk, 'risk')
})

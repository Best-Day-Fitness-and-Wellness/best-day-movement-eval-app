import { TUG, STEPS, STS, GRIP, SCRATCH, CORE, getAgeGroup, getTugAgeGroup } from '../data/norms.js'

function pf(v) {
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

function measured(v) {
  const n = pf(v)
  return n !== null && n >= 0
}

function bestMeasured(...values) {
  const numbers = values.filter(measured).map(pf)
  return numbers.length ? Math.max(...numbers) : null
}

// Calculate total points (each passing test = 1 point)
export function calculatePoints(r, age, sex) {
  const ag = getAgeGroup(age)
  let p = 0

  // Posture: neck angle <= 4cm
  if (measured(r.na) && pf(r.na) <= 4) p++

  // Back Scratch: better side within threshold
  const bs = Math.min(pf(r.sR) ?? 999, pf(r.sL) ?? 999)
  if (bs < 999 && bs >= 0 && bs <= SCRATCH[sex]) p++

  // Ankle Dorsi: vertical or >= 8 degrees
  if (r.aV === 'Y' || (measured(r.aD) && pf(r.aD) >= 8)) p++

  // One Leg Stand: best side >= 5s
  if ((bestMeasured(r.oR, r.oL) ?? -1) >= 5) p++

  // Vestibular turns: no dizziness
  if (r.vT === 'N') p++

  // Vestibular nods: no dizziness
  if (r.vN === 'N') p++

  // TUG: < 14s
  if (measured(r.tug) && pf(r.tug) < 14) p++

  // Tandem walk: <= 2 errors
  if (measured(r.tE) && pf(r.tE) <= 2) p++

  // Tandem eyes closed: >= 5 steps
  if (r.tEC === 'Y') p++

  // 2-Min Step: at or above norm
  if (ag && STEPS[ag] && measured(r.st) && pf(r.st) >= STEPS[ag][sex]) p++

  // Grip R: above norm (input in lbs, norms in kg, 1 lb = 0.4536 kg)
  if (ag && GRIP[ag]) {
    if (measured(r.gR) && pf(r.gR) * 0.4536 >= GRIP[ag][sex].R) p++
    if (measured(r.gL) && pf(r.gL) * 0.4536 >= GRIP[ag][sex].L) p++
  }

  // Calf raises: >= 25 each side
  if (measured(r.cR) && pf(r.cR) >= 25) p++
  if (measured(r.cL) && pf(r.cL) >= 25) p++

  // Sit to Stand: at or above norm
  if (ag && STS[ag] && measured(r.sts) && pf(r.sts) >= STS[ag][sex]) p++

  // Plank: passed 73s
  if (r.plk === 'Y') p++

  // Curl up: any time recorded
  if (measured(r.cu) && pf(r.cu) > 0) p++

  // Back extension: any time recorded
  if (measured(r.be) && pf(r.be) > 0) p++

  // Bonus: Jump
  if (r.jmp === 'Y') p++

  // Double Bonus: Ground get-up
  if (r.gnd === 'Y') p++

  return p
}

// Get individual risk assessments for results view
export function getRisks(r, age, sex) {
  const ag = getAgeGroup(age)
  const tAg = getTugAgeGroup(age)
  const bestOneLeg = bestMeasured(r.oR, r.oL)

  return [
    {
      label: 'Fall Risk (TUG 14s+)',
      level: measured(r.tug) ? (pf(r.tug) >= 14 ? 'risk' : 'safe') : 'none',
    },
    {
      label: 'Disability Risk (TUG >9s)',
      level: measured(r.tug) ? (pf(r.tug) > 9 ? 'risk' : 'safe') : 'none',
    },
    {
      label: 'One Leg Stand (<5s)',
      level: bestOneLeg !== null ? (bestOneLeg < 5 ? 'risk' : 'safe') : 'none',
    },
    {
      label: 'Vestibular Turns',
      level: r.vT === 'Y' ? 'risk' : r.vT === 'N' ? 'safe' : 'none',
    },
    {
      label: 'Vestibular Nods',
      level: r.vN === 'Y' ? 'risk' : r.vN === 'N' ? 'safe' : 'none',
    },
    {
      label: 'Tandem Walk (>2 errors)',
      level: measured(r.tE) ? (pf(r.tE) > 2 ? 'risk' : 'safe') : 'none',
    },
    {
      label: 'Ankle Dorsi (<8°)',
      level: r.aV === 'Y' ? 'safe' : (measured(r.aD) ? (pf(r.aD) < 8 ? 'risk' : 'safe') : 'none'),
    },
    {
      label: 'Calf Raises (<25)',
      level: measured(r.cR) && measured(r.cL) ? (Math.min(pf(r.cR), pf(r.cL)) < 25 ? 'risk' : 'safe') : 'none',
    },
    {
      label: 'Shoulder Flexibility',
      level: measured(r.sR) && measured(r.sL) ? (Math.min(pf(r.sR), pf(r.sL)) > SCRATCH[sex] ? 'risk' : 'safe') : 'none',
    },
    {
      label: 'Core (Plank)',
      level: r.plk === 'N' ? 'risk' : r.plk === 'Y' ? 'safe' : 'none',
    },
  ]
}

// Get bar chart data for results view
export function getBarData(r, age, sex) {
  const ag = getAgeGroup(age)
  const tAg = getTugAgeGroup(age)
  const bestOneLeg = bestMeasured(r.oR, r.oL)

  return [
    {
      label: 'TUG', value: r.tug, unit: 's',
      norm: tAg ? TUG[tAg] : '',
      risk: measured(r.tug) && pf(r.tug) >= 14 ? 'risk' : 'safe',
    },
    {
      label: '2-Min Steps', value: r.st, unit: '',
      norm: ag && STEPS[ag] ? STEPS[ag][sex] : '',
      risk: ag && STEPS[ag] && measured(r.st) ? (pf(r.st) < STEPS[ag][sex] ? 'risk' : 'safe') : 'none',
    },
    {
      label: 'Sit to Stand', value: r.sts, unit: 'reps',
      norm: ag && STS[ag] ? STS[ag][sex] : '',
      risk: ag && STS[ag] && measured(r.sts) ? (pf(r.sts) < STS[ag][sex] ? 'risk' : 'safe') : 'none',
    },
    {
      label: 'One Leg (best)', value: bestOneLeg ?? '', unit: 's',
      norm: 20,
      risk: bestOneLeg !== null ? (bestOneLeg < 5 ? 'risk' : 'safe') : 'none',
    },
    {
      label: 'Calf R', value: r.cR, unit: '',
      norm: 25,
      risk: measured(r.cR) ? (pf(r.cR) < 25 ? 'risk' : 'safe') : 'none',
    },
    {
      label: 'Calf L', value: r.cL, unit: '',
      norm: 25,
      risk: measured(r.cL) ? (pf(r.cL) < 25 ? 'risk' : 'safe') : 'none',
    },
  ]
}

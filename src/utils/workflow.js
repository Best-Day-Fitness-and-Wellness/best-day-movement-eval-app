export const assessmentSteps = [
  { label: 'Client Setup', icon: '📋' },
  { label: 'Flexibility & Balance', icon: '🧘' },
  { label: 'Endurance & Strength', icon: '💪' },
  { label: 'Function & Core', icon: '🏋️' },
  { label: 'Review & Save', icon: '✅' },
]

export function clampStep(step) {
  const parsed = Number(step)
  if (!Number.isFinite(parsed)) return 0
  return Math.min(Math.max(Math.trunc(parsed), 0), assessmentSteps.length - 1)
}

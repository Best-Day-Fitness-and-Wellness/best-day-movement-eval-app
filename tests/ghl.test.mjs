import test from 'node:test'
import assert from 'node:assert/strict'
import { buildGhlContact } from '../ghl-server.js'

test('builds a safe GoHighLevel contact payload from an assessment', () => {
  const payload = buildGhlContact({
    client: { name: 'Alice Test', email: ' Alice@Example.com ', sex: 'F' },
    date: '2026-07-11',
    points: 8,
    results: { tug: 12 },
  }, 'location-1', 'contact.best_day_last_assessment')

  assert.deepEqual(payload, {
    firstName: 'Alice',
    lastName: 'Test',
    name: 'Alice Test',
    email: 'alice@example.com',
    locationId: 'location-1',
    gender: 'female',
    source: 'Best Day Fitness Movement Assessment',
    tags: ['best-day-assessment'],
    customFields: [{
      key: 'contact.best_day_last_assessment',
      fieldValue: JSON.stringify({ date: '2026-07-11', points: 8, results: { tug: 12 } }),
    }],
  })
})

test('does not sync a client without an email address', () => {
  assert.equal(buildGhlContact({ client: { name: 'Alice Test' } }, 'location-1'), null)
})

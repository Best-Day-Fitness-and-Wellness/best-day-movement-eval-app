import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildGhlCalendarEventsUrl,
  buildGhlCalendarListUrl,
  buildGhlAssessmentPayload,
  buildGhlContact,
  buildGhlContactUpdate,
  buildGhlSearchRequest,
  filterMovementEvaluations,
  getGhlSearchErrorMessage,
  normalizeGhlAppointment,
  syncToGoHighLevel,
} from '../ghl-server.js'

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
      fieldValue: JSON.stringify({
        date: '2026-07-11', points: 8, results: { tug: 12 }, notes: '', appointmentId: '',
        consent: { signedAt: '', releaseVersion: '' },
      }),
    }],
  })
})

test('does not sync a client without an email address', () => {
  assert.equal(buildGhlContact({ client: { name: 'Alice Test' } }, 'location-1'), null)
})

test('builds an email-based GoHighLevel contact search request', () => {
  assert.deepEqual(buildGhlSearchRequest('alice@example.com', 'location-1'), {
    locationId: 'location-1',
    page: 1,
    pageLimit: 10,
    filters: [{ field: 'email', operator: 'eq', value: 'alice@example.com' }],
  })
})

test('gives actionable guidance when GoHighLevel rejects a contact lookup', () => {
  assert.equal(
    getGhlSearchErrorMessage(401),
    'GoHighLevel lookup is not authorized. Confirm the Private Integration includes contacts.readonly.',
  )
  assert.equal(
    getGhlSearchErrorMessage(400),
    'GoHighLevel rejected the search. Confirm the location ID and search request.',
  )
})

test('builds a date-bounded GoHighLevel calendar events request', () => {
  assert.equal(buildGhlCalendarListUrl('location-1'),
    'https://services.leadconnectorhq.com/calendars/?locationId=location-1')
  assert.equal(
    buildGhlCalendarEventsUrl({
      locationId: 'location-1',
      calendarId: 'calendar-1',
      startTime: '2026-07-12T00:00:00-04:00',
      endTime: '2026-07-13T00:00:00-04:00',
    }),
    'https://services.leadconnectorhq.com/calendars/events?locationId=location-1&calendarId=calendar-1&startTime=2026-07-12T00%3A00%3A00-04%3A00&endTime=2026-07-13T00%3A00%3A00-04%3A00',
  )
})

test('normalizes a calendar event into an appointment card', () => {
  assert.deepEqual(normalizeGhlAppointment({
    id: 'event-1',
    contactId: 'contact-1',
    title: 'Movement Evaluation',
    startTime: '2026-07-12T09:00:00-04:00',
    endTime: '2026-07-12T10:00:00-04:00',
    assignedUserId: 'user-1',
  }, {
    calendarName: 'Movement Evaluations',
    contact: { name: 'Alice Test', email: 'alice@example.com' },
    trainer: { name: 'Matt Trainer' },
  }), {
    eventId: 'event-1', contactId: 'contact-1', title: 'Movement Evaluation',
    calendarName: 'Movement Evaluations', startTime: '2026-07-12T09:00:00-04:00',
    endTime: '2026-07-12T10:00:00-04:00', clientName: 'Alice Test',
    email: 'alice@example.com', trainerName: 'Matt Trainer',
  })
})

test('keeps only Movement Evaluation appointments', () => {
  const appointments = [
    { title: 'Movement Evaluation', calendarName: 'Senior Assessments' },
    { title: 'Personal Training', calendarName: 'Movement Evaluations' },
    { title: 'Nutrition Check-In', calendarName: 'Consultations' },
  ]
  assert.equal(filterMovementEvaluations(appointments).length, 2)
})

const sessionWithAppointment = {
  client: {
    name: 'Alice Test', email: 'alice@example.com', ghlContactId: 'contact-1',
    notes: 'Use the rail for balance work.', appointmentId: 'event-1',
  },
  date: '2026-07-12', points: 8, results: { tug: 12 },
  consent: {
    signed: true, signedAt: '2026-07-12T13:00:00.000Z',
    signerName: 'Alice Test', releaseVersion: 'movement-release-v1',
    signatureData: 'data:image/png;base64,c2lnbmF0dXJl',
  },
}

test('includes appointment notes and signed release metadata in the assessment field', () => {
  assert.deepEqual(JSON.parse(buildGhlAssessmentPayload(sessionWithAppointment, 'assessment-field').customFields[0].fieldValue), {
    date: '2026-07-12', points: 8, results: { tug: 12 },
    notes: 'Use the rail for balance work.', appointmentId: 'event-1',
    consent: { signedAt: '2026-07-12T13:00:00.000Z', releaseVersion: 'movement-release-v1' },
  })
})

test('updates the selected GoHighLevel contact by contact ID', () => {
  assert.equal(buildGhlContactUpdate('contact-1', sessionWithAppointment, 'assessment-field').url,
    'https://services.leadconnectorhq.com/contacts/contact-1')
})

test('reports partial sync when the assessment saves but the signature upload fails', async () => {
  const originalFetch = global.fetch
  const calls = []
  global.fetch = async (url) => {
    calls.push(url)
    return calls.length === 1
      ? new Response('{}', { status: 200 })
      : new Response('{}', { status: 500 })
  }
  try {
    const result = await syncToGoHighLevel(sessionWithAppointment, {
      token: 'token', locationId: 'location-1',
      assessmentFieldKey: 'assessment-field', releaseSignatureFieldId: 'signature-field',
    })
    assert.equal(result.status, 'partial')
    assert.equal(calls[0], 'https://services.leadconnectorhq.com/contacts/contact-1')
  } finally {
    global.fetch = originalFetch
  }
})

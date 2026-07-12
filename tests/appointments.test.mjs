import test from 'node:test'
import assert from 'node:assert/strict'
import { clientFromAppointment } from '../src/utils/appointments.js'

test('maps a selected appointment into a fresh client without reusing the local id', () => {
  assert.deepEqual(clientFromAppointment({
    contactId: 'contact-1', eventId: 'event-1', clientName: 'Alice Test',
    email: 'alice@example.com', trainerName: 'Matt Trainer',
  }, '2026-07-12'), {
    name: 'Alice Test', age: '', sex: 'M', email: 'alice@example.com',
    trainer: 'Matt Trainer', date: '2026-07-12', notes: '',
    ghlContactId: 'contact-1', appointmentId: 'event-1',
  })
})

const GHL_URL = 'https://services.leadconnectorhq.com/contacts/upsert'
const GHL_SEARCH_URL = 'https://services.leadconnectorhq.com/contacts/search'
const GHL_CALENDARS_URL = 'https://services.leadconnectorhq.com/calendars/'
const GHL_CALENDAR_EVENTS_URL = 'https://services.leadconnectorhq.com/calendars/events'
const GHL_APPOINTMENT_URL = 'https://services.leadconnectorhq.com/calendars/events/appointments'
const GHL_CONTACTS_URL = 'https://services.leadconnectorhq.com/contacts'
const GHL_USERS_URL = 'https://services.leadconnectorhq.com/users'
const MOVEMENT_EVALUATION = /\bmovement\b[\s\S]*\bevaluations?\b|\bevaluations?\b[\s\S]*\bmovement\b/i

export function getGhlSearchErrorMessage(status) {
  if (status === 401 || status === 403) {
    return 'GoHighLevel lookup is not authorized. Confirm the Private Integration includes contacts.readonly.'
  }
  if (status === 400 || status === 422) {
    return 'GoHighLevel rejected the search. Confirm the location ID and search request.'
  }
  return 'GoHighLevel contact lookup failed. Try again or continue manually.'
}

function getGhlReadErrorMessage(status) {
  if (status === 401 || status === 403) {
    return 'GoHighLevel access is not authorized. Add calendar and contact read permissions to the Private Integration.'
  }
  if (status === 400 || status === 422) {
    return 'GoHighLevel rejected the calendar request. Check the location and date settings.'
  }
  return 'GoHighLevel calendar lookup failed. Try again or continue manually.'
}

async function readGhlJson(url, token) {
  let response
  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        Version: '2021-07-28',
      },
    })
  } catch {
    return { ok: false, message: 'GoHighLevel is unavailable. Continue manually or try again.' }
  }

  const body = await response.json().catch(() => ({}))
  if (!response.ok) return { ok: false, message: getGhlReadErrorMessage(response.status) }
  return { ok: true, body }
}

export function buildGhlCalendarListUrl(locationId) {
  return `${GHL_CALENDARS_URL}?locationId=${encodeURIComponent(locationId)}`
}

export function buildGhlCalendarEventsUrl({ locationId, calendarId, startTime, endTime }) {
  const params = new URLSearchParams({ locationId, calendarId, startTime, endTime })
  return `${GHL_CALENDAR_EVENTS_URL}?${params}`
}

function nextDate(date) {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + 1)
  return value.toISOString().slice(0, 10)
}

function appointmentDateBounds(date) {
  return {
    startTime: Date.parse(`${date}T00:00:00Z`),
    endTime: Date.parse(`${nextDate(date)}T00:00:00Z`),
  }
}

export function normalizeGhlAppointment(event, { calendarName = '', contact = {}, trainer = {} } = {}) {
  const contactName = [contact.firstName || contact.firstname || contact.first_name, contact.lastName || contact.lastname || contact.last_name]
    .filter(Boolean).join(' ')
  const titleName = /\bwith\s+(.+)$/i.exec(event.title || '')?.[1]?.trim() || ''
  return {
    eventId: event.id || event.eventId || event.appointmentId || '',
    contactId: event.contactId || event.contact?.id || contact.id || '',
    title: event.title || event.name || '',
    calendarName,
    startTime: event.startTime || event.start || '',
    endTime: event.endTime || event.end || '',
    clientName: event.contactName || event.contact?.name || contact.name || contactName || titleName,
    email: event.email || event.contact?.email || contact.email || '',
    trainerName: event.assignedUserName || event.userName || trainer.name || '',
  }
}

export function filterMovementEvaluations(appointments) {
  return appointments.filter(appointment => [appointment.title, appointment.calendarName]
    .filter(Boolean)
    .some(value => MOVEMENT_EVALUATION.test(value)))
}

export async function getGhlAppointments(date, { token, locationId }) {
  if (!token || !locationId) return { status: 'disabled', appointments: [] }

  const calendarsResponse = await readGhlJson(buildGhlCalendarListUrl(locationId), token)
  if (!calendarsResponse.ok) return { status: 'error', message: calendarsResponse.message, appointments: [] }

  const calendars = (calendarsResponse.body.calendars || []).filter(calendar => calendar.isActive !== false && calendar.id)
  const { startTime, endTime } = appointmentDateBounds(date)
  const eventResponses = await Promise.all(calendars.map(calendar =>
    readGhlJson(buildGhlCalendarEventsUrl({ locationId, calendarId: calendar.id, startTime, endTime }), token)
      .then(response => ({ calendar, response })),
  ))

  const failed = eventResponses.find(({ response }) => !response.ok)
  if (failed) return { status: 'error', message: failed.response.message, appointments: [] }

  const appointments = (await Promise.all(eventResponses.flatMap(({ calendar, response }) => {
    const events = response.body.events || response.body.appointments || []
    return events.map(async event => {
      let contact = event.contact || {}
      const contactId = event.contactId || event.contact?.id || ''
      if (contactId && (!contact.name || !contact.email)) {
        const contactResponse = await readGhlJson(`${GHL_CONTACTS_URL}/${encodeURIComponent(contactId)}`, token)
        if (contactResponse.ok) contact = contactResponse.body.contact || contactResponse.body
      }
      return normalizeGhlAppointment(event, {
        calendarName: calendar.name || '',
        contact,
        trainer: event.assignedUser || {},
      })
    })
  })))

  return { status: 'ready', appointments: filterMovementEvaluations(appointments) }
}

export async function getGhlAppointment(eventId, { token, locationId }) {
  if (!token || !locationId) return { status: 'disabled', appointment: null }

  const response = await readGhlJson(`${GHL_APPOINTMENT_URL}/${encodeURIComponent(eventId)}?locationId=${encodeURIComponent(locationId)}`, token)
  if (!response.ok) return { status: 'error', message: response.message, appointment: null }

  const event = response.body.appointment || response.body.event || response.body
  const contactId = event.contactId || event.contact?.id || ''
  let contact = event.contact || {}
  if (contactId && (!contact.name || !contact.email)) {
    const contactResponse = await readGhlJson(`${GHL_CONTACTS_URL}/${encodeURIComponent(contactId)}`, token)
    if (!contactResponse.ok) return { status: 'error', message: contactResponse.message, appointment: null }
    contact = contactResponse.body.contact || contactResponse.body
  }

  const trainerId = event.assignedUserId || event.userId || ''
  let trainer = event.assignedUser || {}
  if (trainerId && !trainer.name) {
    const trainerResponse = await readGhlJson(`${GHL_USERS_URL}/${encodeURIComponent(trainerId)}`, token)
    if (trainerResponse.ok) trainer = trainerResponse.body.user || trainerResponse.body
  }

  const appointment = normalizeGhlAppointment(event, {
    calendarName: event.calendarName || event.calendar?.name || '',
    contact,
    trainer,
  })
  return appointment.eventId ? { status: 'found', appointment } : { status: 'empty', appointment: null }
}

function compact(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined && value !== null && value !== ''))
}

export function buildGhlSearchRequest(query, locationId) {
  return {
    locationId,
    page: 1,
    pageLimit: 10,
    filters: [{ field: 'email', operator: 'eq', value: String(query).trim().toLowerCase() }],
  }
}

export function buildGhlAssessmentPayload(session, assessmentFieldKey) {
  const details = {
    date: session.date || '',
    points: Number.isFinite(Number(session.points)) ? Number(session.points) : 0,
    results: session.results || {},
    notes: session.client?.notes || '',
    appointmentId: session.client?.appointmentId || '',
    consent: {
      signedAt: session.consent?.signedAt || '',
      releaseVersion: session.consent?.releaseVersion || '',
    },
  }

  return {
    customFields: assessmentFieldKey ? [{
      key: assessmentFieldKey,
      fieldValue: JSON.stringify(details),
    }] : [],
  }
}

export function buildGhlContactUpdate(contactId, session, assessmentFieldKey) {
  const assessment = buildGhlAssessmentPayload(session, assessmentFieldKey)
  return {
    url: `${GHL_CONTACTS_URL}/${encodeURIComponent(contactId)}`,
    body: compact({
      customFields: assessment.customFields.length ? assessment.customFields : undefined,
      tags: ['best-day-assessment'],
    }),
  }
}

export function buildGhlContact(session, locationId, assessmentFieldKey) {
  const client = session?.client || {}
  const name = String(client.name || '').trim()
  const email = String(client.email || '').trim().toLowerCase()
  if (!name || !email || !locationId) return null

  const [firstName, ...lastNameParts] = name.split(/\s+/)
  return compact({
    firstName,
    lastName: lastNameParts.join(' ') || undefined,
    name,
    email,
    locationId,
    gender: client.sex === 'F' ? 'female' : client.sex === 'M' ? 'male' : undefined,
    source: 'Best Day Fitness Movement Assessment',
    tags: ['best-day-assessment'],
    customFields: assessmentFieldKey
      ? buildGhlAssessmentPayload(session, assessmentFieldKey).customFields
      : undefined,
  })
}

function responseMessage(response, fallback) {
  return response.ok ? '' : fallback
}

async function uploadGhlReleaseSignature(contactId, signatureData, fieldId, token, locationId) {
  const match = /^data:(image\/png);base64,(.+)$/.exec(String(signatureData || ''))
  if (!match || !fieldId) return { ok: false, message: 'The signed release is not configured for upload.' }

  const form = new FormData()
  form.append(`${fieldId}_${crypto.randomUUID()}`, new Blob([Buffer.from(match[2], 'base64')], { type: match[1] }), 'best-day-exercise-release.png')
  let response
  try {
    response = await fetch(`https://services.leadconnectorhq.com/forms/upload-custom-files?contactId=${encodeURIComponent(contactId)}&locationId=${encodeURIComponent(locationId)}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        Version: '2021-07-28',
      },
      body: form,
    })
  } catch {
    return { ok: false, message: 'The assessment synced, but the signed release upload was unavailable.' }
  }

  return { ok: response.ok, message: responseMessage(response, 'The assessment synced, but the signed release upload failed.') }
}

export async function syncToGoHighLevel(session, { token, locationId, assessmentFieldKey, releaseSignatureFieldId }) {
  if (!token || !locationId) return { status: 'disabled' }

  const contactId = session.client?.ghlContactId || ''
  const payload = contactId ? buildGhlContactUpdate(contactId, session, assessmentFieldKey) : buildGhlContact(session, locationId, assessmentFieldKey)
  if (!payload) return { status: 'skipped', message: 'Saved locally. Add an email address to sync this client to GoHighLevel.' }

  const response = await fetch(contactId ? payload.url : GHL_URL, {
    method: contactId ? 'PUT' : 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Version: '2021-07-28',
    },
    body: JSON.stringify(contactId ? payload.body : payload),
  })

  if (!response.ok) return { status: 'error', message: 'GoHighLevel rejected the assessment sync.' }
  const body = await response.json().catch(() => ({}))

  if (session.consent?.signatureData && !releaseSignatureFieldId) {
    return { status: 'partial', message: 'The assessment synced, but the signed release upload is not configured.' }
  }

  if (contactId && releaseSignatureFieldId && session.consent?.signatureData) {
    const upload = await uploadGhlReleaseSignature(contactId, session.consent.signatureData, releaseSignatureFieldId, token, locationId)
    if (!upload.ok) return { status: 'partial', message: upload.message }
  }

  return { status: 'synced', created: body.new === true }
}

export async function searchGoHighLevel(query, { token, locationId }) {
  if (!token || !locationId) return { status: 'disabled', contacts: [] }

  const payload = buildGhlSearchRequest(query, locationId)
  const response = await fetch(GHL_SEARCH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Version: '2021-07-28',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) return { status: 'error', message: getGhlSearchErrorMessage(response.status), contacts: [] }
  const body = await response.json().catch(() => ({}))
  const contacts = (body.contacts || []).map(contact => ({
    id: contact.id,
    name: contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(' '),
    email: contact.email || '',
  }))
  return { status: contacts.length ? 'found' : 'empty', contacts }
}

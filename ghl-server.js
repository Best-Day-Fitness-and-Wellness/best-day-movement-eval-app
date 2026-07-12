const GHL_URL = 'https://services.leadconnectorhq.com/contacts/upsert'
const GHL_SEARCH_URL = 'https://services.leadconnectorhq.com/contacts/search'
const GHL_CALENDARS_URL = 'https://services.leadconnectorhq.com/calendars/'
const GHL_CALENDAR_EVENTS_URL = 'https://services.leadconnectorhq.com/calendars/events'
const GHL_APPOINTMENT_URL = 'https://services.leadconnectorhq.com/calendars/events/appointments'
const GHL_CONTACTS_URL = 'https://services.leadconnectorhq.com/contacts'
const GHL_USERS_URL = 'https://services.leadconnectorhq.com/users'
const MOVEMENT_EVALUATION = /movement\s*evaluation/i

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
    startTime: `${date}T00:00:00`,
    endTime: `${nextDate(date)}T00:00:00`,
  }
}

export function normalizeGhlAppointment(event, { calendarName = '', contact = {}, trainer = {} } = {}) {
  return {
    eventId: event.id || event.eventId || event.appointmentId || '',
    contactId: event.contactId || event.contact?.id || contact.id || '',
    title: event.title || event.name || '',
    calendarName,
    startTime: event.startTime || event.start || '',
    endTime: event.endTime || event.end || '',
    clientName: event.contactName || event.contact?.name || contact.name || '',
    email: event.email || event.contact?.email || contact.email || '',
    trainerName: event.assignedUserName || event.userName || trainer.name || '',
  }
}

export function filterMovementEvaluations(appointments) {
  return appointments.filter(appointment => MOVEMENT_EVALUATION.test(
    [appointment.title, appointment.calendarName].filter(Boolean).join(' '),
  ))
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

  const appointments = eventResponses.flatMap(({ calendar, response }) => {
    const events = response.body.events || response.body.appointments || []
    return events.map(event => normalizeGhlAppointment(event, {
      calendarName: calendar.name || '',
      contact: event.contact || {},
      trainer: event.assignedUser || {},
    }))
  })

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
    customFields: assessmentFieldKey ? [{
      key: assessmentFieldKey,
      fieldValue: JSON.stringify({
        date: session.date || '',
        points: Number.isFinite(Number(session.points)) ? Number(session.points) : 0,
        results: session.results || {},
      }),
    }] : undefined,
  })
}

export async function syncToGoHighLevel(session, { token, locationId, assessmentFieldKey }) {
  if (!token || !locationId) return { status: 'disabled' }

  const payload = buildGhlContact(session, locationId, assessmentFieldKey)
  if (!payload) {
    return { status: 'skipped', message: 'Saved locally. Add an email address to sync this client to GoHighLevel.' }
  }

  const response = await fetch(GHL_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Version: '2021-07-28',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) return { status: 'error', message: 'GoHighLevel rejected the assessment sync.' }
  const body = await response.json().catch(() => ({}))
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

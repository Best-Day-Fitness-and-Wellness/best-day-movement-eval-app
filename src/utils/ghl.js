export async function syncAssessment(session) {
  const response = await fetch('/api/ghl/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || 'GoHighLevel sync failed.')
  return body
}

async function getJson(url, fallbackMessage) {
  let response
  try {
    response = await fetch(url)
  } catch {
    throw new Error('GoHighLevel is unavailable. Continue manually or try again.')
  }
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || fallbackMessage)
  return body
}

export async function loadGhlAppointments(date) {
  return getJson(`/api/ghl/appointments?date=${encodeURIComponent(date)}`, 'GoHighLevel appointment lookup failed.')
}

export async function loadGhlAppointment(eventId) {
  return getJson(`/api/ghl/appointments/${encodeURIComponent(eventId)}`, 'GoHighLevel appointment lookup failed.')
}

export async function searchGhlContacts(query) {
  let response
  try {
    response = await fetch(`/api/ghl/contacts/search?q=${encodeURIComponent(query)}`)
  } catch {
    throw new Error('Lookup service is offline. If this is local, run npm run dev; otherwise check Railway.')
  }
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || 'GoHighLevel contact lookup failed.')
  return body
}

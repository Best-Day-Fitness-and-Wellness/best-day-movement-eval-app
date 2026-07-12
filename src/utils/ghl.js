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

export async function searchGhlContacts(query) {
  const response = await fetch(`/api/ghl/contacts/search?q=${encodeURIComponent(query)}`)
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || 'GoHighLevel contact lookup failed.')
  return body
}

const GHL_URL = 'https://services.leadconnectorhq.com/contacts/upsert'

function compact(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined && value !== null && value !== ''))
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

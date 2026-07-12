import express from 'express'
import compression from 'compression'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { getGhlAppointment, getGhlAppointments, searchGoHighLevel, syncToGoHighLevel } from './ghl-server.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000
const dist = join(__dirname, 'dist')
const assets = join(dist, 'assets')

app.use(compression())
app.use(express.json({ limit: '100kb' }))

app.post('/api/ghl/sync', async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || !req.body.client || typeof req.body.client !== 'object') {
    return res.status(400).json({ status: 'error', message: 'Invalid assessment payload.' })
  }

  try {
    const result = await syncToGoHighLevel(req.body, {
      token: process.env.GHL_PRIVATE_INTEGRATION_TOKEN,
      locationId: process.env.GHL_LOCATION_ID,
      assessmentFieldKey: process.env.GHL_ASSESSMENT_FIELD_KEY,
      releaseSignatureFieldId: process.env.GHL_RELEASE_SIGNATURE_FIELD_ID,
    })
    return res.status(result.status === 'error' ? 502 : 200).json(result)
  } catch {
    return res.status(502).json({ status: 'error', message: 'GoHighLevel sync failed.' })
  }
})

app.get('/api/ghl/appointments', async (req, res) => {
  const date = String(req.query.date || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ status: 'error', message: 'Choose a valid appointment date.' })
  }

  try {
    const result = await getGhlAppointments(date, {
      token: process.env.GHL_PRIVATE_INTEGRATION_TOKEN,
      locationId: process.env.GHL_LOCATION_ID,
    })
    return res.status(result.status === 'error' ? 502 : 200).json(result)
  } catch {
    return res.status(502).json({ status: 'error', message: 'GoHighLevel appointment lookup failed.' })
  }
})

app.get('/api/ghl/appointments/:eventId', async (req, res) => {
  const eventId = String(req.params.eventId || '').trim()
  if (!eventId || eventId.length > 200) {
    return res.status(400).json({ status: 'error', message: 'Choose a valid appointment.' })
  }

  try {
    const result = await getGhlAppointment(eventId, {
      token: process.env.GHL_PRIVATE_INTEGRATION_TOKEN,
      locationId: process.env.GHL_LOCATION_ID,
    })
    return res.status(result.status === 'error' ? 502 : 200).json(result)
  } catch {
    return res.status(502).json({ status: 'error', message: 'GoHighLevel appointment lookup failed.' })
  }
})

app.get('/api/ghl/contacts/search', async (req, res) => {
  const query = String(req.query.q || '').trim()
  if (query.length < 3 || query.length > 200) {
    return res.status(400).json({ status: 'error', message: 'Enter at least 3 characters to search.' })
  }

  try {
    const result = await searchGoHighLevel(query, {
      token: process.env.GHL_PRIVATE_INTEGRATION_TOKEN,
      locationId: process.env.GHL_LOCATION_ID,
    })
    return res.status(result.status === 'error' ? 502 : 200).json(result)
  } catch {
    return res.status(502).json({ status: 'error', message: 'GoHighLevel contact lookup failed.' })
  }
})

// Serve hashed assets for a year; keep the HTML revalidated for deployments.
app.use(express.static(dist, {
  setHeaders(res, filePath) {
    res.setHeader('Cache-Control', filePath.startsWith(assets)
      ? 'public, max-age=31536000, immutable'
      : 'no-cache')
  },
}))

// SPA fallback - serve index.html for all non-file routes
app.get('/{*splat}', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache')
  res.sendFile(join(dist, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Best Day Assessment running on port ${PORT}`)
})

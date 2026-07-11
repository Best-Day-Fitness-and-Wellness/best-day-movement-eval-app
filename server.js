import express from 'express'
import compression from 'compression'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000
const dist = join(__dirname, 'dist')
const assets = join(dist, 'assets')

app.use(compression())

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

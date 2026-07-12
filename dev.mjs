import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

const processes = [
  spawn(process.execPath, ['server.js'], { stdio: 'inherit' }),
  spawn(process.execPath, [resolve('node_modules/vite/bin/vite.js'), '--host', '127.0.0.1'], { stdio: 'inherit' }),
]

let stopping = false

function stop() {
  if (stopping) return
  stopping = true
  for (const child of processes) child.kill()
}

for (const child of processes) {
  child.on('exit', code => {
    if (!stopping && code !== 0) process.exitCode = code || 1
    stop()
  })
}

process.on('SIGINT', () => {
  stop()
  process.exit(0)
})

process.on('SIGTERM', () => {
  stop()
  process.exit(0)
})

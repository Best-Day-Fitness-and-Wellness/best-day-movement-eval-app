import { useEffect, useRef } from 'react'
import { useTheme } from '../ThemeContext'

export default function SignaturePad({ value, onChange }) {
  const { C } = useTheme()
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scale = window.devicePixelRatio || 1
    canvas.width = Math.max(1, Math.round(rect.width * scale))
    canvas.height = Math.max(1, Math.round(rect.height * scale))
    const context = canvas.getContext('2d')
    context.setTransform(scale, 0, 0, scale, 0, 0)
    context.fillStyle = C.cardAlt
    context.fillRect(0, 0, rect.width, rect.height)
    context.strokeStyle = C.text
    context.lineWidth = 2
    context.lineCap = 'round'
    context.lineJoin = 'round'
    if (value) {
      const image = new Image()
      image.onload = () => context.drawImage(image, 0, 0, rect.width, rect.height)
      image.src = value
    }
  }, [C.cardAlt, C.text, value])

  function point(event) {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  function start(event) {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    const { x, y } = point(event)
    drawingRef.current = true
    canvas.setPointerCapture(event.pointerId)
    context.beginPath()
    context.moveTo(x, y)
  }

  function move(event) {
    if (!drawingRef.current) return
    const { x, y } = point(event)
    const context = canvasRef.current.getContext('2d')
    context.lineTo(x, y)
    context.stroke()
  }

  function finish(event) {
    if (!drawingRef.current) return
    drawingRef.current = false
    if (canvasRef.current.hasPointerCapture(event.pointerId)) canvasRef.current.releasePointerCapture(event.pointerId)
    onChange(canvasRef.current.toDataURL('image/png'))
  }

  function clear() {
    onChange('')
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        aria-label="Client signature"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
        style={{ display: 'block', width: '100%', height: 180, border: `1px solid ${C.border}`, borderRadius: 10, touchAction: 'none', cursor: 'crosshair' }}
      />
      <button type="button" onClick={clear} style={{ marginTop: 8, minHeight: 44, padding: '8px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.cardAlt, color: C.text, cursor: 'pointer', fontWeight: 700 }}>
        Clear signature
      </button>
    </div>
  )
}

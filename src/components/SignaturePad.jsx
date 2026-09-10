import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

const SignaturePad = forwardRef(function SignaturePad(_props, ref) {
  const canvasRef = useRef(null)
  const isDrawing = useRef(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#0d9488'
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  function getPos(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const point = e.touches ? e.touches[0] : e
    return { x: point.clientX - rect.left, y: point.clientY - rect.top }
  }

  function startDrawing(e) {
    isDrawing.current = true
    setHasSignature(true)
    const ctx = canvasRef.current.getContext('2d')
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    e.preventDefault()
  }

  function draw(e) {
    if (!isDrawing.current) return
    const ctx = canvasRef.current.getContext('2d')
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    e.preventDefault()
  }

  function stopDrawing() {
    if (!isDrawing.current) return
    canvasRef.current.getContext('2d').closePath()
    isDrawing.current = false
  }

  function clear() {
    const canvas = canvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  useImperativeHandle(ref, () => ({
    clear,
    isEmpty: () => !hasSignature,
    toDataURL: () => canvasRef.current.toDataURL('image/png'),
  }))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm font-medium text-on-surface-variant">
        <span>Draw your signature below</span>
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1 text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-[16px]">restart_alt</span>
          <span>Clear</span>
        </button>
      </div>
      <div className="relative h-36 w-full overflow-hidden rounded-xl bg-surface-low shadow-inner">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-on-surface-variant/40">
            <span className="material-symbols-outlined mb-1 text-[28px]">edit</span>
            <span className="text-sm font-semibold tracking-wider uppercase">Sign Here</span>
          </div>
        )}
      </div>
    </div>
  )
})

export default SignaturePad

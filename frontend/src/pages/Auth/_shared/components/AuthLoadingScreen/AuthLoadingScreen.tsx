import { useEffect, useState } from 'react'
import { Image } from 'antd'

interface AuthLoadingScreenProps {
  fadeDuration?: number
  duration?: number
  onDone?: () => void
}

export function AuthLoadingScreen({
  duration = 1800,
  fadeDuration = 420,
  onDone,
}: AuthLoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [fading, setFading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const startTime = performance.now()
    const ease = (t: number) => 1 - Math.pow(1 - t, 3)
    let raf: number

    const tick = (now: number) => {
      const elapsed = now - startTime
      const raw = Math.min(elapsed / duration, 1)
      const eased = ease(raw)

      setProgress(Math.round(eased * 100))

      if (raw < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setTimeout(() => {
          setFading(true)
          setTimeout(() => {
            setDone(true)
            onDone?.()
          }, fadeDuration)
        }, 180)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [duration, fadeDuration, onDone])

  if (done) return null

  const clipValue = `inset(${100 - progress}% 0 0 0)`

  return (
    <div
      aria-label="Loading"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f7',
        transition: `opacity ${fadeDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'all',
      }}
    >
      <div style={{ position: 'relative', width: 320, height: 320 }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.1 }}>
          <Image
            src="/tech-logo.png"
            alt="TechVanguard"
            preview={false}
            width="100%"
            height="100%"
            style={{ objectFit: 'contain', userSelect: 'none', filter: 'grayscale(100%) brightness(0)' }}
            draggable={false}
          />
        </div>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: clipValue,
            transition: 'clip-path 80ms linear',
          }}
        >
          <Image
            src="/tech-logo.png"
            alt=""
            preview={false}
            width="100%"
            height="100%"
            style={{ objectFit: 'contain', userSelect: 'none', filter: 'grayscale(100%) brightness(0)' }}
            draggable={false}
          />
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Image } from 'antd'

export function PageLoading() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let raf: number
    const duration = 1500
    
    const tick = (now: number) => {
      const raw = (now % duration) / duration
      const eased = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2
      setProgress(Math.round(eased * 100))
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const clipValue = `inset(${100 - progress}% 0 0 0)`

  return (
    <div
      aria-label="Loading"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#faf8ff]"
    >
      <div className="relative w-80 h-80">
        <div className="absolute inset-0 opacity-10">
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
          className="absolute inset-0"
          style={{
            clipPath: clipValue,
            transition: 'clip-path 50ms linear',
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

import { Image } from 'antd'

interface TechLogoProps {
  size?: number
  className?: string
}

export function TechLogo({ size = 64, className = '' }: TechLogoProps) {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/tech-logo.png"
        alt="TechVanguard"
        preview={false}
        width={size}
        height={size}
        style={{ objectFit: 'contain', userSelect: 'none' }}
        draggable={false}
      />
    </div>
  )
}

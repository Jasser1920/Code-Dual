import { useEffect, useState } from 'react'
import Confetti from 'react-confetti'

interface ConfettiOverlayProps {
  active: boolean
  win: boolean
}

export function ConfettiOverlay({ active, win }: ConfettiOverlayProps) {
  const [windowDimension, setDimension] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  const detectSize = () => {
    setDimension({ width: window.innerWidth, height: window.innerHeight })
  }

  useEffect(() => {
    window.addEventListener('resize', detectSize)
    return () => {
      window.removeEventListener('resize', detectSize)
    }
  }, [])

  if (!active) return null

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <Confetti
        width={windowDimension.width}
        height={windowDimension.height}
        colors={
          win
            ? ['#22c55e', '#3b82f6', '#eab308']
            : ['#ef4444', '#f97316', '#dc2626']
        }
        numberOfPieces={win ? 500 : 200}
        gravity={win ? 0.1 : 0.3}
        recycle={false}
      />
    </div>
  )
}

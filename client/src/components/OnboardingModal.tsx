import { useState, useRef, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'
import { Button } from './ui/button'

import video1 from '../assets/CODE_dual/Video 1.mp4'
import video2 from '../assets/CODE_dual/Video 2.mp4'
import video3 from '../assets/CODE_dual/Video 3.mp4'
import video4 from '../assets/CODE_dual/Video 4.mp4'

interface OnboardingModalProps {
  onClose: () => void
}

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  const steps = [
    {
      video: video1,
      title: 'Find your Opponent',
      description:
        'Click "Find a Duel" and wait for the matchmaking system to pair you with a rival engineer.',
    },
    {
      video: video2,
      title: 'The Arena',
      description:
        'Read the problem description carefully. Write your code in the editor, and keep an eye on the global countdown timer.',
    },
    {
      video: video3,
      title: 'Run & Submit',
      description:
        'Use the Run button to test your code against public test cases. When you are ready, smash Submit to win the duel!',
    },
    {
      video: video4,
      title: 'Victory or Defeat',
      description:
        'Review your match results, see the rating changes, and check out how fast you were compared to your opponent.',
    },
  ]

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === step) {
          video.currentTime = 0
          video.play().catch((err) => console.log('Autoplay blocked:', err))
        } else {
          video.pause()
        }
      }
    })
  }, [step])

  const [dontShowAgain, setDontShowAgain] = useState(false)

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('code_dual_onboarding_seen', 'true')
    } else {
      localStorage.removeItem('code_dual_onboarding_seen')
    }
    onClose()
  }

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      handleClose()
    }
  }

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-card border-2 border-border shadow-[12px_12px_0px_0px_hsl(var(--accent))] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
          <div className="font-['Barlow_Condensed'] font-extrabold uppercase tracking-widest text-lg text-foreground">
            Welcome to Code-Dual
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row h-full">
          {/* Left: Video */}
          <div className="flex-1 bg-black/50 border-r border-border relative aspect-video md:aspect-auto">
            {steps.map((s, index) => (
              <video
                key={index}
                ref={(el) => {
                  videoRefs.current[index] = el
                }}
                src={s.video}
                muted
                loop
                playsInline
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                  index === step ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              />
            ))}
          </div>

          {/* Right: Text & Controls */}
          <div className="flex flex-col justify-between w-full md:w-80 p-8 bg-card shrink-0">
            <div>
              <div className="font-['JetBrains_Mono'] text-xs text-accent mb-4">
                Step {step + 1} of {steps.length}
              </div>
              <h2 className="font-['Barlow_Condensed'] font-bold text-3xl uppercase tracking-widest text-foreground mb-4">
                {steps[step].title}
              </h2>
              <p className="font-['Barlow'] text-muted-foreground leading-relaxed">
                {steps[step].description}
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="dontShowAgain"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 rounded border-border bg-background accent-accent cursor-pointer"
                />
                <label
                  htmlFor="dontShowAgain"
                  className="font-['JetBrains_Mono'] text-xs text-muted-foreground cursor-pointer select-none"
                >
                  Don't show this again
                </label>
              </div>
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={step === 0}
                  className="font-['Barlow_Condensed'] font-bold uppercase tracking-widest"
                >
                  <ChevronLeft size={16} className="mr-1" /> Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="font-['Barlow_Condensed'] font-bold uppercase tracking-widest bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {step === steps.length - 1 ? 'Start Coding!' : 'Next'}{' '}
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

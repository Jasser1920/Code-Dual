import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useSocketStore } from '../lib/socket'
import { CodeEditor } from '../components/editor/CodeEditor'
import { LanguageSelector } from '../components/editor/LanguageSelector'
import { ProblemPanel } from '../components/editor/ProblemPanel'
import type { Problem } from '../components/editor/ProblemPanel'
import { RunPanel } from '../components/editor/RunPanel'
import {
  ArrowLeft,
  Clock,
  Loader2,
  Check,
  Zap,
  AlertTriangle,
} from 'lucide-react'
import axios from 'axios'
import { JUDGE0_LANGUAGE_IDS } from '../utils/judge0'
import { toast } from 'sonner'

// Mock Problem Data
const MOCK_PROBLEM: Problem = {
  title: 'Two Sum',
  difficulty: 'Easy',
  description:
    'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
  examples: [
    {
      input: 'nums = [2,7,11,15], target = 9',
      output: '[0,1]',
      explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
    },
    { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
  ],
  constraints: [
    '<code>2 <= nums.length <= 10<sup>4</sup></code>',
    '<code>-10<sup>9</sup> <= nums[i] <= 10<sup>9</sup></code>',
    '<code>-10<sup>9</sup> <= target <= 10<sup>9</sup></code>',
    '<strong>Only one valid answer exists.</strong>',
  ],
}

const DEFAULT_CODE: Record<string, string> = {
  javascript:
    'function twoSum(nums, target) {\n  // Write your code here\n  \n}',
  python: 'def twoSum(nums, target):\n    # Write your code here\n    pass',
  java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n        \n    }\n}',
  cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n        \n    }\n};',
  go: 'func twoSum(nums []int, target int) []int {\n    // Write your code here\n    \n}',
  rust: 'impl Solution {\n    pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {\n        // Write your code here\n        \n    }\n}',
}

export default function DuelArena() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { socket, connect } = useSocketStore()

  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState(DEFAULT_CODE['javascript'])
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)

  const [showForfeitModal, setShowForfeitModal] = useState(false)
  const [isForfeiting, setIsForfeiting] = useState(false)

  const [opponentJoined, setOpponentJoined] = useState(false)
  const [opponentDisconnected, setOpponentDisconnected] = useState(false)
  const [opponentSubmitted, setOpponentSubmitted] = useState(false)
  const [opponentCode, setOpponentCode] = useState('')
  const [opponentProfile, setOpponentProfile] = useState<{
    username: string
    elo: number
    avatarUrl: string | null
  } | null>(null)
  const [currentActivity, setCurrentActivity] = useState<string | null>(null)
  const [activityVisible, setActivityVisible] = useState(false)

  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [remainingTime, setRemainingTime] = useState(15 * 60)

  // Connect to room
  useEffect(() => {
    connect()
  }, [connect])

  useEffect(() => {
    if (!socket || !roomId || !user) return

    socket.emit('join_room', { roomId, userId: user.id })

    socket.on('opponent_joined', () => {
      setOpponentJoined(true)
      setOpponentDisconnected(false)
    })

    socket.on('code_update', (newCode: string) => {
      setOpponentCode(newCode)
    })

    socket.on('duel_start', () => {
      setOpponentJoined(true)
      setOpponentDisconnected(false)
    })

    socket.on('timer_tick', ({ remaining }) => {
      setRemainingTime(remaining)
    })

    socket.on('opponent_info', (info: any) => {
      setOpponentProfile(info)
    })

    socket.on('opponent_activity', (activity: string | null) => {
      if (activity) {
        if (activity.includes('Submitted Code')) {
          setOpponentSubmitted(true)
        }
        if (activity.includes('Opponent disconnected')) {
          setOpponentDisconnected(true)
        }

        setCurrentActivity(activity)
        setActivityVisible(true)

        if (activityTimeoutRef.current) {
          clearTimeout(activityTimeoutRef.current)
        }

        activityTimeoutRef.current = setTimeout(
          () => {
            setActivityVisible(false)
          },
          activity === 'Typing...' ? 1500 : 4000
        )
      }
    })

    socket.on('restore_state', ({ code, language, remainingTime }) => {
      setCode(code)
      setLanguage(language)
      setRemainingTime(remainingTime)
      setOpponentJoined(true) // Since they are restoring, the room was already full!
    })

    socket.on('evaluating_results', () => {
      setIsEvaluating(true)
    })

    socket.on(
      'duel_end',
      ({
        winnerId,
        isDraw,
        playerCodes,
        playerLanguages,
        eloUpdates,
        analysis,
      }) => {
        const myId = user.id
        const opponentId =
          Object.keys(playerCodes).find((id) => id !== myId) || 'unknown'

        const status = isDraw
          ? 'DRAW'
          : winnerId === myId
            ? 'VICTORY'
            : 'DEFEAT'

        navigate(`/duel/${roomId}/result`, {
          state: {
            myCode: playerCodes[myId] || code,
            opponentCode: playerCodes[opponentId] || opponentCode,
            result: status,
            language: playerLanguages[myId] || language,
            eloUpdates: eloUpdates,
            analysis: analysis,
            myId: myId,
            opponentId: opponentId,
          },
        })
      }
    )

    return () => {
      socket.off('opponent_joined')
      socket.off('code_update')
      socket.off('duel_start')
      socket.off('restore_state')
      socket.off('timer_tick')
      socket.off('opponent_activity')
      socket.off('evaluating_results')
      socket.off('duel_end')
    }
  }, [socket, roomId, user])

  // Format seconds into MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang)
    const isDefault = Object.values(DEFAULT_CODE).includes(code) || !code.trim()
    if (isDefault) {
      setCode(DEFAULT_CODE[newLang] || '')
    }
  }

  const handleRunCode = async () => {
    setIsRunning(true)
    setResult(null)
    socket?.emit('opponent_activity', { roomId, activity: 'Running tests...' })

    try {
      const languageId = JUDGE0_LANGUAGE_IDS[language]

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/execute`,
        {
          code,
          languageId,
        },
        {
          withCredentials: true,
        }
      )

      setResult({
        success: response.data.status === 'Accepted',
        status: response.data.status,
        output:
          response.data.stdout ||
          response.data.compile_output ||
          response.data.stderr,
        time: response.data.time
          ? `${(response.data.time * 1000).toFixed(0)}ms`
          : '-',
        memory: response.data.memory
          ? `${(response.data.memory / 1024).toFixed(1)} MB`
          : '-',
      })
    } catch (error: any) {
      console.error(error)
      setResult({
        success: false,
        status: 'Error',
        output:
          error.response?.data?.error || 'Failed to execute code on server.',
        time: '-',
        memory: '-',
      })
    } finally {
      setIsRunning(false)
      socket?.emit('opponent_activity', { roomId, activity: null })
    }
  }

  const handleSubmitCode = () => {
    if (
      confirm(
        "Are you sure you want to submit your final code? You won't be able to edit it anymore."
      )
    ) {
      setIsSubmitted(true)
      socket?.emit('submit_code', { roomId, userId: user?.id })
    }
  }

  return (
    <div
      className={`h-screen flex flex-col bg-background overflow-hidden relative transition-all duration-300 ${
        opponentSubmitted
          ? 'border-[6px] border-destructive shadow-[inset_0_0_80px_rgba(220,38,38,0.5)]'
          : ''
      }`}
    >
      {/* Custom Forfeit Modal */}
      {showForfeitModal && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="bg-card border border-destructive/50 shadow-[0_0_30px_rgba(220,38,38,0.15)] rounded-sm max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            {isForfeiting ? (
              <div className="flex flex-col items-center py-6">
                <h3 className="font-['Barlow_Condensed'] text-2xl font-bold uppercase tracking-widest text-destructive mb-6">
                  Leaving...
                </h3>
                <div className="w-full h-1.5 bg-secondary overflow-hidden rounded-none relative">
                  <div className="absolute inset-y-0 left-0 bg-destructive w-full animate-pulse"></div>
                </div>
                <p className="mt-4 font-['JetBrains_Mono'] text-xs text-muted-foreground uppercase tracking-widest">
                  Processing Forfeit
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4 text-destructive">
                  <AlertTriangle size={24} />
                  <h3 className="font-['Barlow_Condensed'] text-2xl font-bold uppercase tracking-widest">
                    Forfeit Match?
                  </h3>
                </div>
                <p className="font-['JetBrains_Mono'] text-sm text-muted-foreground mb-8 leading-relaxed">
                  If you leave this match, it will be recorded as a forfeit and
                  you will automatically{' '}
                  <strong className="text-foreground">lose the match</strong>{' '}
                  and drop in rating. Are you sure?
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowForfeitModal(false)}
                    className="px-4 py-2 font-['Barlow_Condensed'] uppercase tracking-widest font-bold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setIsForfeiting(true)
                      socket?.emit('forfeit', { roomId, userId: user?.id })
                    }}
                    className="px-6 py-2 bg-destructive text-destructive-foreground font-['Barlow_Condensed'] uppercase tracking-widest font-bold rounded-sm hover:bg-destructive/90 transition-colors"
                  >
                    Yes, Forfeit
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Evaluation Loading Overlay */}
      {isEvaluating && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
          <div className="flex flex-col items-center w-full max-w-sm px-6">
            <h2 className="font-['Barlow_Condensed'] text-2xl font-bold uppercase tracking-[0.2em] text-foreground mb-6">
              Evaluating Results
            </h2>
            <div className="w-full h-1.5 bg-secondary overflow-hidden rounded-none relative">
              <div className="absolute inset-y-0 left-0 bg-foreground w-full animate-pulse"></div>
            </div>
            <p className="mt-4 font-['JetBrains_Mono'] text-xs text-muted-foreground tracking-widest uppercase">
              Executing tests...
            </p>
          </div>
        </div>
      )}

      {/* Top Navbar specifically for Arena */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowForfeitModal(true)}
            className="text-muted-foreground hover:text-destructive transition-colors"
            title="Forfeit Match"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col">
            <span className="font-['JetBrains_Mono'] text-xs text-muted-foreground uppercase tracking-widest">
              Room
            </span>
            <span className="font-['JetBrains_Mono'] text-sm text-foreground">
              {roomId || 'practice-mode'}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div
            className={`flex items-center gap-2 font-['JetBrains_Mono'] text-xl font-bold transition-colors duration-300 ${
              opponentSubmitted
                ? 'text-destructive animate-pulse scale-110'
                : 'text-accent'
            }`}
          >
            <Clock
              size={18}
              className={opponentSubmitted ? 'animate-pulse' : ''}
            />
            {formatTime(remainingTime)}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {roomId && (
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${
                  !opponentJoined
                    ? 'bg-yellow-500'
                    : opponentDisconnected
                      ? 'bg-destructive'
                      : 'bg-green-500'
                }`}
              />
              <div className="flex flex-col">
                <span className="font-['JetBrains_Mono'] text-xs text-muted-foreground">
                  {!opponentJoined
                    ? 'Waiting for Opponent...'
                    : opponentDisconnected
                      ? 'Opponent Disconnected'
                      : 'Opponent Ready'}
                </span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="font-['JetBrains_Mono'] text-sm text-foreground">
                {opponentProfile?.username || 'Waiting...'}
              </div>
              <div className="font-['JetBrains_Mono'] text-xs text-accent">
                Rating: {opponentProfile?.elo || '-'}
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden border border-border shrink-0">
              {opponentProfile?.avatarUrl ? (
                <img
                  src={opponentProfile.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">
                  {(opponentProfile?.username || '?').charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Custom Slider Notification */}
      <div
        className={`absolute top-16 right-4 z-40 bg-card border border-border rounded-sm shadow-md px-4 py-2 transition-all duration-300 ease-in-out flex items-center gap-2 ${
          activityVisible && currentActivity
            ? 'translate-y-0 opacity-100'
            : '-translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <span className="font-['JetBrains_Mono'] text-sm font-bold text-accent tracking-widest uppercase">
          Opponent Action:{' '}
          <span className="text-foreground font-normal normal-case">
            {currentActivity}
          </span>
        </span>
      </div>

      {/* Main Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Problem */}
        <div className="w-1/2 min-w-[300px]">
          <ProblemPanel problem={MOCK_PROBLEM} />
        </div>

        {/* Right Side: Editor & Runner */}
        <div className="w-1/2 flex flex-col min-w-[300px] border-l border-border bg-background">
          <div className="h-12 border-b border-border bg-secondary/50 flex items-center justify-between px-4 shrink-0">
            <LanguageSelector
              language={language}
              setLanguage={handleLanguageChange}
              disabled={isSubmitted}
            />
          </div>

          {/* Monaco Editor takes remaining space */}
          <div className="relative flex-1 flex flex-col min-h-0">
            <CodeEditor
              language={language}
              code={code}
              readOnly={isSubmitted}
              onChange={(val) => {
                const newCode = val || ''
                setCode(newCode)
                socket?.emit('code_update', {
                  roomId,
                  userId: user?.id,
                  code: newCode,
                  language,
                })
                socket?.emit('opponent_activity', {
                  roomId,
                  activity: 'Typing...',
                })
              }}
            />

            {/* Locked Overlay after submission */}
            {isSubmitted && !isEvaluating && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] pointer-events-auto">
                <div className="bg-card border border-border p-8 rounded-xl shadow-2xl text-center max-w-sm">
                  <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-5 border border-green-500/30">
                    <Check className="text-green-500" size={32} />
                  </div>
                  <h3 className="font-['Barlow_Condensed'] text-2xl font-bold uppercase tracking-wider text-foreground mb-3">
                    Code Locked
                  </h3>
                  <p className="font-['JetBrains_Mono'] text-sm text-muted-foreground mb-6 leading-relaxed">
                    You submitted your final solution. You cannot add another
                    line of code while waiting for your opponent.
                  </p>
                  <div className="flex items-center justify-center gap-3 text-accent bg-accent/10 py-2 px-4 rounded-full border border-accent/20 inline-flex">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="font-['JetBrains_Mono'] text-xs uppercase tracking-widest font-bold">
                      Waiting for opponent...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Run Console at bottom */}
          <RunPanel
            onRun={handleRunCode}
            onSubmit={handleSubmitCode}
            isRunning={isRunning}
            isSubmitted={isSubmitted}
            result={result}
          />
        </div>
      </div>

      {/* Waiting Overlay */}
      {!opponentJoined && roomId && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
          <div className="flex flex-col items-center text-center max-w-md w-full">
            <Loader2 size={48} className="text-accent animate-spin mb-6" />
            <h2 className="font-['Barlow_Condensed'] font-extrabold text-3xl uppercase tracking-widest text-foreground mb-2">
              Waiting for opponent...
            </h2>
            <p className="font-['Barlow'] text-sm text-muted-foreground mb-8">
              The duel will automatically start as soon as another player joins
              the room.
            </p>

            <div className="w-full bg-secondary/50 border border-border p-4 rounded text-left">
              <span className="font-['JetBrains_Mono'] text-xs text-muted-foreground uppercase tracking-widest block mb-2">
                Invite a Friend
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/duel/${roomId}`}
                  className="flex-1 bg-background border border-border px-3 py-2 text-sm font-['JetBrains_Mono'] text-foreground focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/duel/${roomId}`
                    )
                    alert('Link copied!')
                  }}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2 font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-sm transition-colors"
                >
                  Copy Link
                </button>
              </div>
            </div>

            <button
              onClick={() => navigate('/')}
              className="mt-8 border border-border text-muted-foreground hover:text-foreground font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-sm px-8 py-3 transition-colors"
            >
              Cancel & Leave
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

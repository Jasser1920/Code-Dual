import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useSocketStore } from '../lib/socket'
import { CodeEditor } from '../components/editor/CodeEditor'
import { LanguageSelector } from '../components/editor/LanguageSelector'
import { ProblemPanel } from '../components/editor/ProblemPanel'
import type { Problem } from '../components/editor/ProblemPanel'
import { RunPanel } from '../components/editor/RunPanel'
import { ArrowLeft, Clock, Loader2 } from 'lucide-react'
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

  const [opponentJoined, setOpponentJoined] = useState(false)
  const [opponentCode, setOpponentCode] = useState('')

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
    })

    socket.on('code_update', (newCode: string) => {
      setOpponentCode(newCode)
    })

    socket.on('duel_start', () => {
      setOpponentJoined(true)
    })

    socket.on('timer_tick', ({ remaining }) => {
      setRemainingTime(remaining)
    })

    socket.on('opponent_activity', (activity: string | null) => {
      if (activity) {
        toast(
          <div className="flex flex-col font-['JetBrains_Mono']">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Opponent Action
            </span>
            <span className="text-sm text-accent font-bold animate-pulse">
              {activity}
            </span>
          </div>,
          {
            id: 'opponent-activity',
            duration: activity === 'Typing...' ? 1500 : 4000,
          }
        )
      }
    })

    socket.on('restore_state', ({ code, language, remainingTime }) => {
      setCode(code)
      setLanguage(language)
      setRemainingTime(remainingTime)
      setOpponentJoined(true) // Since they are restoring, the room was already full!
    })

    socket.on(
      'duel_end',
      ({ winnerId, isDraw, playerCodes, playerLanguages, eloUpdates }) => {
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
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Navbar specifically for Arena */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground transition-colors"
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
          <div className="flex items-center gap-2 text-accent font-['JetBrains_Mono'] text-xl font-bold">
            <Clock size={18} />
            {formatTime(remainingTime)}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {roomId && (
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${opponentJoined ? 'bg-green-500' : 'bg-yellow-500'}`}
              />
              <div className="flex flex-col">
                <span className="font-['JetBrains_Mono'] text-xs text-muted-foreground">
                  {opponentJoined
                    ? 'Opponent Ready'
                    : 'Waiting for Opponent...'}
                </span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="font-['JetBrains_Mono'] text-sm text-foreground">
                {user?.username || 'You'}
              </div>
              <div className="font-['JetBrains_Mono'] text-xs text-accent">
                Rating: {user?.elo || 1000}
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden border border-border">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">
                  {(user?.username || 'U').charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

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

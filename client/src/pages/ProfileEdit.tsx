import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { api } from '../api/axios'
import { Code2, ArrowRight, ArrowLeft, Upload, Lock, X } from 'lucide-react'
import Avatar from '../components/Avatar'
import { LANGUAGES } from '../data/mock'
import { COUNTRIES } from '../data/countries'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

// Phone number formatter
const formatTunisianNumber = (val: string) => {
  const rawDigits = val.replace(/\D/g, '')
  const localDigits = rawDigits.startsWith('216')
    ? rawDigits.slice(3)
    : rawDigits
  const limited = localDigits.slice(0, 8)

  if (!limited) return '+216 '

  let result = '+216 '
  if (limited.length <= 2) return result + limited
  if (limited.length <= 5)
    return result + limited.slice(0, 2) + ' ' + limited.slice(2)
  return (
    result +
    limited.slice(0, 2) +
    ' ' +
    limited.slice(2, 5) +
    ' ' +
    limited.slice(5)
  )
}

// Password strength calculator
const getPasswordStrength = (pass: string) => {
  let score = 0
  if (pass.length > 7) score++
  if (/[A-Z]/.test(pass)) score++
  if (/[0-9]/.test(pass)) score++
  if (/[^A-Za-z0-9]/.test(pass)) score++
  return score
}
const strengthColors = [
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-lime-500',
  'bg-emerald-500',
]
const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent']

export default function ProfileEdit() {
  const { user, updateProfile, isLoading, error } = useAuthStore()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    location: '',
    mobileNumber: '',
    avatarUrl: '',
    preferredLang: 'javascript',
  })

  const [phoneError, setPhoneError] = useState('')
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)

  // Password state
  const [pwdForm, setPwdForm] = useState({ old: '', new: '', repeat: '' })
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState(false)
  const [isChangingPwd, setIsChangingPwd] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        location: user.location || '',
        mobileNumber: user.mobileNumber
          ? formatTunisianNumber(user.mobileNumber)
          : '+216 ',
        avatarUrl: user.avatarUrl || '',
        preferredLang: user.preferredLang || 'Python',
      })
    }
  }, [user])

  if (!user) return null

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setForm({ ...form, avatarUrl: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPhoneError('')

    // Validate Tunisian Mobile Number: +216 followed by 8 digits (formatted with spaces)
    const tunisiaRegex = /^\+216 \d{2} \d{3} \d{3}$/
    if (!tunisiaRegex.test(form.mobileNumber)) {
      setPhoneError(
        'Mobile number must be exactly 8 digits after +216 (e.g., +216 58 496 156)'
      )
      return
    }

    try {
      await updateProfile(form)
      navigate(`/profile/${user.username}`)
    } catch {
      // Error is handled and displayed by Zustand store
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdError('')
    setPwdSuccess(false)

    if (pwdForm.new !== pwdForm.repeat) {
      setPwdError('New passwords do not match.')
      return
    }

    if (pwdForm.new.length < 6) {
      setPwdError('Password must be at least 6 characters long.')
      return
    }

    try {
      setIsChangingPwd(true)
      await api.put('/profile/password', {
        oldPassword: pwdForm.old,
        newPassword: pwdForm.new,
      })
      setPwdSuccess(true)
      setPwdForm({ old: '', new: '', repeat: '' })
      setTimeout(() => {
        setIsPasswordModalOpen(false)
        setPwdSuccess(false)
      }, 2000)
    } catch (err: any) {
      setPwdError(err.response?.data?.error || 'Failed to change password.')
    } finally {
      setIsChangingPwd(false)
    }
  }

  const pwdStrength = getPasswordStrength(pwdForm.new)

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-6 py-12 relative">
      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-2 mb-6">
              <Lock size={20} className="text-accent" />
              <h2 className="font-['Barlow_Condensed'] font-extrabold text-2xl uppercase tracking-widest text-foreground">
                Change Password
              </h2>
            </div>

            {pwdError && (
              <div className="mb-4 p-3 border border-red-500/30 bg-red-500/10 text-red-500 font-['JetBrains_Mono'] text-xs">
                {pwdError}
              </div>
            )}
            {pwdSuccess && (
              <div className="mb-4 p-3 border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-['JetBrains_Mono'] text-xs">
                Password changed successfully!
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-1">
                <label className="font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-xs text-foreground">
                  Old Password
                </label>
                <Input
                  type="password"
                  required
                  value={pwdForm.old}
                  onChange={(e) =>
                    setPwdForm({ ...pwdForm, old: e.target.value })
                  }
                  className="font-['JetBrains_Mono'] bg-secondary/50 border-border"
                />
              </div>
              <div className="space-y-1">
                <label className="font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-xs text-foreground">
                  New Password
                </label>
                <Input
                  type="password"
                  required
                  value={pwdForm.new}
                  onChange={(e) =>
                    setPwdForm({ ...pwdForm, new: e.target.value })
                  }
                  className="font-['JetBrains_Mono'] bg-secondary/50 border-border"
                />
                {pwdForm.new && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden flex">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-full flex-1 border-r border-background/20 last:border-r-0 ${i <= pwdStrength ? strengthColors[pwdStrength] : 'bg-transparent'}`}
                        />
                      ))}
                    </div>
                    <p
                      className={`text-right text-[10px] mt-1 font-['JetBrains_Mono'] ${pwdStrength > 0 ? strengthColors[pwdStrength].replace('bg-', 'text-') : 'text-muted-foreground'}`}
                    >
                      {strengthLabels[pwdStrength]}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-xs text-foreground">
                  Repeat New Password
                </label>
                <Input
                  type="password"
                  required
                  value={pwdForm.repeat}
                  onChange={(e) =>
                    setPwdForm({ ...pwdForm, repeat: e.target.value })
                  }
                  className="font-['JetBrains_Mono'] bg-secondary/50 border-border"
                />
              </div>
              <Button
                type="submit"
                disabled={isChangingPwd}
                className="w-full font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-sm mt-4"
                size="lg"
              >
                {isChangingPwd ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </div>
        </div>
      )}

      <div className="w-full max-w-lg mb-4 flex justify-start">
        <Button
          variant="ghost"
          onClick={() => navigate(`/profile/${user.username}`)}
          className="font-['Barlow_Condensed'] uppercase tracking-widest font-bold text-muted-foreground"
        >
          <ArrowLeft size={16} className="mr-2" /> Back to My Profile
        </Button>
      </div>

      <div className="w-full max-w-lg border border-border bg-card p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Code2 size={24} className="text-accent" />
            <h1 className="font-['Barlow_Condensed'] font-extrabold text-3xl uppercase tracking-widest text-foreground">
              Complete Profile
            </h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
            className="font-['Barlow_Condensed'] uppercase tracking-widest"
          >
            <Lock size={12} className="mr-2" /> Change Password
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-red-500/30 bg-red-500/10 text-red-500 font-['JetBrains_Mono'] text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-6 mb-8 p-4 bg-secondary/30 border border-border">
            <Avatar
              user={{ ...user, avatarUrl: form.avatarUrl }}
              size="xl"
              className="shadow-xl shrink-0"
            />
            <div className="flex-1 space-y-3">
              <label className="block font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-sm text-foreground">
                Profile Picture
              </label>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="font-['JetBrains_Mono'] text-xs h-8"
                >
                  <Upload size={14} className="mr-2" /> Upload from PC
                </Button>
                {form.avatarUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setForm({ ...form, avatarUrl: '' })}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 font-['JetBrains_Mono'] text-xs h-8"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-sm text-foreground">
              Location *
            </label>
            <select
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full bg-secondary border border-border px-4 py-3 text-foreground font-['JetBrains_Mono'] text-sm focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
            >
              <option value="" disabled>
                Select your country
              </option>
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-sm text-foreground">
              Mobile Number *
            </label>
            <Input
              required
              type="tel"
              value={form.mobileNumber}
              onChange={(e) => {
                const val = e.target.value
                if (val.length < 5) {
                  setForm({ ...form, mobileNumber: '' })
                  return
                }
                setForm({ ...form, mobileNumber: formatTunisianNumber(val) })
              }}
              className={`font-['JetBrains_Mono'] bg-secondary/50 border-border h-11 ${phoneError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              placeholder="+216 58 496 156"
            />
            {phoneError && (
              <p className="font-['Barlow'] text-xs text-red-500 mt-1">
                {phoneError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-sm text-foreground">
              Preferred Language
            </label>
            <select
              value={form.preferredLang}
              onChange={(e) =>
                setForm({ ...form, preferredLang: e.target.value })
              }
              className="w-full bg-secondary border border-border px-4 py-3 text-foreground font-['JetBrains_Mono'] text-sm focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
            >
              {LANGUAGES.filter((l) => l !== 'All').map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            size="lg"
            className="w-full font-['Barlow_Condensed'] font-bold uppercase tracking-widest text-base mt-8 h-12"
          >
            {isLoading ? 'Saving...' : 'Save Profile'}
            {!isLoading && <ArrowRight size={18} className="ml-2" />}
          </Button>
        </form>
      </div>
    </div>
  )
}

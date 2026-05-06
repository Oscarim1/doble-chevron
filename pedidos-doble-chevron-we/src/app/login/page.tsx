'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getApiUrl } from '@/utils/api'
import LogoLogin from '../components/LogoLogin'
import LogoLoader from '../components/LogoLoader'
import {
  HiMail,
  HiLockClosed,
  HiUser,
  HiIdentification,
  HiEye,
  HiEyeOff,
} from 'react-icons/hi'

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // login form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // register form
  const [rEmail, setREmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [rut, setRut] = useState('')
  const [rPassword, setRPassword] = useState('')
  const [showRPassword, setShowRPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [rPasswordError, setRPasswordError] = useState('')
  const [rEmailError, setREmailError] = useState('')

  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      router.replace('/products')
    }
  }, [router])

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  function validateLoginFields() {
    let valid = true
    setEmailError('')
    setPasswordError('')
    if (!email) {
      setEmailError('El correo es obligatorio')
      valid = false
    }
    if (email && !isValidEmail(email)) {
      setEmailError('Formato de correo inválido')
      valid = false
    }
    if (!password) {
      setPasswordError('La contraseña es obligatoria')
      valid = false
    }
    if (password && password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres')
      valid = false
    }
    return valid
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validateLoginFields()) return
    setError(null)
    setResult(null)
    setSubmitting(true)
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Request failed')
      }
      const data = await res.json()
      setResult(data)
      const token = data?.access_token || data?.accessToken || data?.token
      const refresh = data?.refreshToken || data?.refresh_token
      if (token) localStorage.setItem('token', token)
      if (refresh) localStorage.setItem('refreshToken', refresh)
      if (token) {
        router.push('/products')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function validateRegisterFields() {
    let valid = true
    setREmailError('')
    setRPasswordError('')
    if (!rEmail) {
      setREmailError('El correo es obligatorio')
      valid = false
    } else if (!isValidEmail(rEmail)) {
      setREmailError('Formato de correo inválido')
      valid = false
    }
    if (!rPassword) {
      setRPasswordError('La contraseña es obligatoria')
      valid = false
    } else if (rPassword.length < 6) {
      setRPasswordError('La contraseña debe tener al menos 6 caracteres')
      valid = false
    } else if (rPassword !== confirmPassword) {
      setRPasswordError('Las contraseñas no coinciden')
      valid = false
    }
    return valid
  }

  function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validateRegisterFields()) return
    // Aquí iría la lógica para registrarse en el backend
    setREmail('')
    setFullName('')
    setRut('')
    setRPassword('')
    setConfirmPassword('')
    alert('Registro simulado')
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-orange-50 gap-5">
        <LogoLoader className="h-20 w-20 animate-bounce drop-shadow-lg" />
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col">
      {/* Logo centrado y clickeable */}
      <nav className="py-8">
        <div className="flex justify-center">
          <a href="/" tabIndex={0} aria-label="Ir al inicio">
            <LogoLogin className="h-24 w-auto transition-transform hover:scale-105 drop-shadow-xl" />
          </a>
        </div>
      </nav>
      <main className="flex flex-col items-center justify-center flex-grow px-2">
        <div className="w-full max-w-md bg-white/90 rounded-2xl shadow-2xl p-8 border border-orange-100 transition-all">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-orange-500 tracking-wide">
            {isRegister ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}
          </h2>
          {isRegister ? (
            <form onSubmit={handleRegister} className="space-y-5">
              <InputWithIcon
                icon={<HiMail className="text-orange-400" />}
                type="email"
                placeholder="Correo electrónico"
                value={rEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setREmail(e.target.value)}
                required
                autoComplete="email"
                label="Correo electrónico"
                error={rEmailError}
              />
              <InputWithIcon
                icon={<HiUser className="text-orange-400" />}
                type="text"
                placeholder="Nombre y apellido"
                value={fullName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                required
                label="Nombre y apellido"
              />
              <InputWithIcon
                icon={<HiIdentification className="text-orange-400" />}
                type="text"
                placeholder="RUT"
                value={rut}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRut(e.target.value)}
                required
                label="RUT"
              />
              <InputWithIcon
                icon={<HiLockClosed className="text-orange-400" />}
                type={showRPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={rPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRPassword(e.target.value)}
                required
                autoComplete="new-password"
                label="Contraseña"
                showPassword={showRPassword}
                setShowPassword={setShowRPassword}
                error={rPasswordError}
              />
              <InputWithIcon
                icon={<HiLockClosed className="text-orange-400" />}
                type={showRPassword ? 'text' : 'password'}
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                label="Confirmar contraseña"
                showPassword={showRPassword}
                setShowPassword={setShowRPassword}
                error={rPasswordError}
              />
              {rPasswordError && (
                <p className="text-red-500 text-sm">{rPasswordError}</p>
              )}
              <ActionButton text="Registrarse" disabled={submitting} loading={submitting} />
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <InputWithIcon
                icon={<HiMail className="text-orange-400" />}
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                autoComplete="email"
                label="Correo electrónico"
                error={emailError}
              />
              <InputWithIcon
                icon={<HiLockClosed className="text-orange-400" />}
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                label="Contraseña"
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                error={passwordError}
              />
              <ActionButton text="Iniciar sesión" disabled={submitting} loading={submitting} />
            </form>
          )}

          {/* Feedback global */}
          {error && <p className="text-red-500 mt-3 text-sm text-center">{error}</p>}
          

          {/* Separador visual */}
          <div className="flex items-center my-7">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="mx-2 text-gray-400 text-xs">{isRegister ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>
          <div className="text-center">
            <button
              className="text-base font-bold text-orange-500 hover:underline focus:outline-none focus:ring-2 focus:ring-orange-300 px-2 py-1 rounded transition"
              onClick={() => {
                setIsRegister(!isRegister)
                setPasswordError('')
                setEmailError('')
                setRPasswordError('')
                setREmailError('')
                setError(null)
              }}
              type="button"
            >
              {isRegister ? 'Inicia sesión' : 'Regístrate'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

// Input con ícono y feedback
function InputWithIcon({
  icon,
  label,
  showPassword,
  setShowPassword,
  error,
  ...props
}: any) {
  const id = props.id || props.placeholder || label
  return (
    <div>
      {/* Label sólo para accesibilidad */}
      <label htmlFor={id} className="sr-only">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">{icon}</span>
        <input
          {...props}
          id={id}
          className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 transition bg-white text-gray-700 placeholder-[#E38A1B] font-medium shadow-sm ${error ? 'border-red-400' : 'border-gray-200'}`}
        />
        {typeof showPassword === 'boolean' && setShowPassword && (
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-orange-300 hover:text-orange-500 focus:outline-none"
            onClick={() => setShowPassword((v: boolean) => !v)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
          </button>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

// Botón principal con loading y estado disabled
function ActionButton({
  text,
  disabled,
  loading,
}: {
  text: string
  disabled?: boolean
  loading?: boolean
}) {
  return (
    <button
      type="submit"
      className={`w-full flex items-center justify-center bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white py-3 rounded-lg font-bold shadow-md transition-transform active:scale-95 mt-2 disabled:opacity-70 disabled:cursor-not-allowed`}
      disabled={disabled}
    >
      {loading && (
        <span className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
      )}
      {text}
    </button>
  )
}

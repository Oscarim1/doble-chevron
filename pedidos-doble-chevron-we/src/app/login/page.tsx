'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getApiUrl } from '@/utils/api'
import LogoLoader from '../components/LogoLoader'

/* ── SVG icons (stroke-only, same spec as el diseño) ── */
const MailSvg = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
)
const LockSvg = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 018 0v3" />
  </svg>
)
const UserSvg = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
)
const IdSvg = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="9" cy="12" r="2.5" />
    <path d="M14 10h4M14 14h4" />
  </svg>
)

/* ── CSS fiel al diseño HTML ── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .dc-login {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1.05fr 1fr;
    font-family: "DM Sans", var(--font-geist-sans), system-ui, sans-serif;
    color: #221813;
  }

  /* ── Panel badge (desktop) ── */
  .dc-media {
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 30px;
    padding: 40px;
    background: radial-gradient(120% 100% at 50% 30%, #2b1d14 0%, #18100b 70%, #120b07 100%);
  }
  .dc-media__texture {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(45deg, rgba(232,181,71,0.05) 0 2px, transparent 2px 16px);
    pointer-events: none;
  }
  .dc-media__foot {
    position: relative;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(243,213,138,0.6);
  }

  /* ── Badge medallón ── */
  .dc-badge {
    position: relative;
    width: min(70%, 380px);
    aspect-ratio: 1;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 38%, #241811 0%, #160e09 100%);
    border: 5px solid #E8B547;
    box-shadow:
      0 0 0 2px #160e09,
      0 0 0 8px rgba(232,181,71,0.28),
      0 24px 60px -18px rgba(0,0,0,0.7);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 8% 10%;
    text-align: center;
  }
  .dc-badge::after {
    content: "";
    position: absolute;
    inset: 12px;
    border-radius: 50%;
    border: 1.5px dashed rgba(232,181,71,0.35);
    pointer-events: none;
  }
  .dc-badge__icons {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 8%;
    width: 78%;
    margin-bottom: 2%;
  }
  .dc-badge__icons svg {
    height: clamp(26px, 4.2vw, 42px);
    width: auto;
    fill: #FBF1E2;
  }
  .dc-badge__name {
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 0.82;
    color: #fff;
    font-family: "Anton", "Alfa Slab One", var(--font-alfa-slab-one), serif;
    text-shadow: 0 2px 0 rgba(0,0,0,0.4);
  }
  .dc-badge__d1 {
    font-size: clamp(30px, 5.5vw, 52px);
    letter-spacing: 0.02em;
  }
  .dc-badge__d2 {
    font-size: clamp(38px, 7vw, 66px);
    letter-spacing: 0.005em;
    color: #FBF1E2;
  }
  .dc-badge__sub {
    margin-top: 6%;
    font-family: "Yellowtail", var(--font-yellowtail), cursive;
    font-size: clamp(16px, 2.6vw, 27px);
    color: #E8B547;
    display: flex;
    align-items: center;
    gap: 10px;
    white-space: nowrap;
  }
  .dc-badge__chev {
    font-family: "DM Sans", var(--font-geist-sans), system-ui, sans-serif;
    font-weight: 800;
    font-size: 0.7em;
    color: rgba(232,181,71,0.7);
  }

  /* ── Panel formulario ── */
  .dc-form-pane {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 56px;
    background: #FBF1E2;
    overflow-y: auto;
  }
  .dc-form-box { width: 100%; max-width: 380px; }

  .dc-eyebrow {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #D8482A;
    margin-bottom: 14px;
  }
  .dc-title {
    font-family: "Alfa Slab One", var(--font-alfa-slab-one), serif;
    font-weight: 400;
    font-size: clamp(34px, 4.4vw, 42px);
    line-height: 1;
    letter-spacing: -0.015em;
    margin: 0;
    color: #221813;
  }
  .dc-title em {
    font-family: "Yellowtail", var(--font-yellowtail), cursive;
    font-style: normal;
    color: #D8482A;
    letter-spacing: 0;
    font-size: clamp(38px, 5vw, 50px);
  }
  .dc-sub { font-size: 15px; color: #4A3A30; margin: 12px 0 30px; }

  .dc-label {
    display: block;
    font-size: 12.5px;
    font-weight: 700;
    letter-spacing: 0.02em;
    margin: 16px 0 7px;
    color: #221813;
  }

  .dc-field {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 52px;
    padding: 0 14px;
    background: #FFFCF6;
    border: 1.5px solid #E5D5BA;
    border-radius: 12px;
    transition: border-color 150ms, box-shadow 150ms;
  }
  .dc-field:focus-within {
    border-color: #D8482A;
    box-shadow: 0 0 0 4px rgba(216,72,42,0.12);
  }
  .dc-field.is-error { border-color: #D8482A; }
  .dc-field svg {
    width: 19px;
    height: 19px;
    stroke: #D8482A;
    stroke-width: 1.7;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
    flex-shrink: 0;
  }
  .dc-field input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    font-family: "DM Sans", var(--font-geist-sans), system-ui, sans-serif;
    font-size: 15px;
    color: #221813;
  }
  .dc-field input::placeholder { color: #9E8870; }
  .dc-eye-btn {
    border: none;
    background: transparent;
    color: #4A3A30;
    font-family: "DM Sans", var(--font-geist-sans), system-ui, sans-serif;
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
  }
  .dc-field-error {
    margin: 5px 0 0;
    font-size: 12px;
    color: #D8482A;
    font-weight: 600;
  }

  .dc-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 18px 0 24px;
  }
  .dc-remember {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #4A3A30;
    cursor: pointer;
  }
  .dc-remember input { accent-color: #D8482A; width: 15px; height: 15px; cursor: pointer; }
  .dc-forgot {
    color: #D8482A;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
  }

  .dc-error-global {
    margin: 12px 0 0;
    padding: 10px 14px;
    background: rgba(216,72,42,0.08);
    border: 1px solid rgba(216,72,42,0.25);
    border-radius: 8px;
    font-size: 13px;
    color: #B73516;
    font-weight: 600;
  }

  .dc-submit {
    width: 100%;
    height: 54px;
    border: 1.5px solid #221813;
    border-radius: 12px;
    background: #D8482A;
    color: #FBF1E2;
    font-family: "DM Sans", var(--font-geist-sans), system-ui, sans-serif;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.01em;
    cursor: pointer;
    box-shadow: 0 4px 0 #221813;
    transition: transform 120ms, box-shadow 120ms;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 4px;
  }
  .dc-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 0 #221813; }
  .dc-submit:active:not(:disabled) { transform: translateY(3px); box-shadow: 0 1px 0 #221813; }
  .dc-submit:disabled { opacity: 0.65; cursor: not-allowed; box-shadow: none; transform: none; }

  .dc-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(251,241,226,0.35);
    border-top-color: #FBF1E2;
    border-radius: 50%;
    animation: dc-spin 0.7s linear infinite;
    flex-shrink: 0;
  }
  @keyframes dc-spin { to { transform: rotate(360deg); } }

  .dc-foot {
    margin-top: 26px;
    text-align: center;
    font-size: 13.5px;
    color: #4A3A30;
  }
  .dc-foot-link {
    color: #D8482A;
    font-weight: 700;
    text-decoration: none;
    background: transparent;
    border: none;
    font-family: inherit;
    font-size: inherit;
    cursor: pointer;
    padding: 0;
  }
  .dc-foot-link:hover { text-decoration: underline; }

  /* ── Wordmark compartido ── */
  .dc-wordmark {
    font-family: "Yellowtail", var(--font-yellowtail), cursive;
    font-weight: 400;
    line-height: 0.88;
    letter-spacing: -0.01em;
    color: #FBF1E2;
    text-shadow:
      2px  2px 0 #221813,
     -1px -1px 0 #221813,
      1px -1px 0 #221813,
     -1px  1px 0 #221813;
  }

  /* ── Banda de marca solo móvil ── */
  .dc-mobile-brand { display: none; }

  /* ── Responsive ── */
  @media (max-width: 860px) {
    .dc-login { grid-template-columns: 1fr; }
    .dc-media { display: none; }

    .dc-mobile-brand {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      position: relative;
      padding: 44px 24px 38px;
      background: linear-gradient(165deg, #D8482A 0%, #8A2810 100%);
      overflow: hidden;
    }
    .dc-mobile-brand::before {
      content: "";
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(45deg, rgba(34,24,19,0.10) 0 14px, transparent 14px 28px);
    }
    .dc-mobile-brand .dc-wordmark {
      position: relative;
      font-size: 52px;
      line-height: 0.86;
      text-align: center;
    }
    .dc-mobile-star {
      position: absolute;
      top: 22px;
      right: 26px;
      font-size: 22px;
      color: #E8B547;
    }
    .dc-mobile-tag {
      position: relative;
      font-size: 11.5px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #F3D58A;
    }

    .dc-form-pane {
      align-items: flex-start;
      padding: 34px 24px 48px;
    }
    .dc-form-box { max-width: 440px; margin: 0 auto; }
    .dc-eyebrow { display: none; }
    .dc-title { text-align: center; }
    .dc-sub { text-align: center; }
  }

  @media (max-width: 400px) {
    .dc-row { flex-direction: column; align-items: stretch; gap: 14px; }
    .dc-forgot { text-align: right; }
  }
`

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [error, setError] = useState<string | null>(null)

  // register
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
    if (token) router.replace('/select-mode')
  }, [router])

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  function isValidEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) }

  function validateLogin() {
    let ok = true
    setEmailError(''); setPasswordError('')
    if (!email)                    { setEmailError('El correo es obligatorio'); ok = false }
    else if (!isValidEmail(email)) { setEmailError('Formato de correo inválido'); ok = false }
    if (!password)                 { setPasswordError('La contraseña es obligatoria'); ok = false }
    else if (password.length < 6) { setPasswordError('Mínimo 6 caracteres'); ok = false }
    return ok
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!validateLogin()) return
    setError(null); setSubmitting(true)
    try {
      const res = await fetch(`${getApiUrl()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) throw new Error(await res.text() || 'Error al iniciar sesión')
      const data = await res.json()
      const token   = data?.access_token || data?.accessToken || data?.token
      const refresh = data?.refreshToken  || data?.refresh_token
      if (token)   localStorage.setItem('token', token)
      if (refresh) localStorage.setItem('refreshToken', refresh)
      if (token)   router.push('/select-mode')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function validateRegister() {
    let ok = true
    setREmailError(''); setRPasswordError('')
    if (!rEmail)                             { setREmailError('El correo es obligatorio'); ok = false }
    else if (!isValidEmail(rEmail))          { setREmailError('Formato de correo inválido'); ok = false }
    if (!rPassword)                          { setRPasswordError('La contraseña es obligatoria'); ok = false }
    else if (rPassword.length < 6)          { setRPasswordError('Mínimo 6 caracteres'); ok = false }
    else if (rPassword !== confirmPassword) { setRPasswordError('Las contraseñas no coinciden'); ok = false }
    return ok
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!validateRegister()) return
    setREmail(''); setFullName(''); setRut(''); setRPassword(''); setConfirmPassword('')
    alert('Registro simulado')
  }

  function switchMode() {
    setIsRegister(r => !r)
    setEmailError(''); setPasswordError('')
    setREmailError(''); setRPasswordError('')
    setError(null)
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', background: '#FBF1E2', gap: 24,
      }}>
        <LogoLoader className="h-16 w-16" />
        <span className="block w-8 h-8 border-[3px] border-[#221813] border-t-[#D8482A] rounded-full animate-spin" />
      </div>
    )
  }

  /* ── Page ── */
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <main className="dc-login">

        {/* ── Panel badge / medallón (desktop) ── */}
        <section className="dc-media">
          <div className="dc-media__texture" />

          <div className="dc-badge">
            {/* Iconos: copa, vaso, burger — fill cream */}
            <div className="dc-badge__icons">
              <svg viewBox="0 0 64 58" aria-hidden="true">
                <path d="M7 24 Q7 9 32 9 Q57 9 57 24 Z" />
                <rect x="7" y="28" width="50" height="7" rx="3.5" />
                <rect x="7" y="39" width="50" height="13" rx="6.5" />
              </svg>
              <svg viewBox="0 0 48 58" aria-hidden="true">
                <rect x="27" y="3" width="4" height="13" rx="2" transform="rotate(13 29 9)" />
                <rect x="8" y="11" width="32" height="6" rx="3" />
                <path d="M11 19 h26 l-2.6 31 q-0.5 4 -4 4 H17.6 q-3.5 0 -4 -4 Z" />
              </svg>
              <svg viewBox="0 0 48 58" aria-hidden="true">
                <rect x="13" y="7" width="5" height="26" rx="2.5" />
                <rect x="21" y="3" width="5" height="30" rx="2.5" />
                <rect x="29" y="9" width="5" height="24" rx="2.5" />
                <path d="M9 29 h30 l-2.8 21 q-0.5 4 -4 4 H15.8 q-3.5 0 -4 -4 Z" />
              </svg>
            </div>

            <div className="dc-badge__name">
              <span className="dc-badge__d1">DOBLE</span>
              <span className="dc-badge__d2">CHEVRON</span>
            </div>

            <div className="dc-badge__sub">
              <span className="dc-badge__chev">«</span>
              Fuente de soda
              <span className="dc-badge__chev">»</span>
            </div>
          </div>

          <div className="dc-media__foot">Sistema de punto de venta</div>
        </section>

        {/* ── Banda de marca (solo móvil) ── */}
        <div className="dc-mobile-brand">
          <span className="dc-mobile-star">★</span>
          <span className="dc-wordmark">Doble Chevron</span>
          <span className="dc-mobile-tag">Punto de venta · acceso del equipo</span>
        </div>

        {/* ── Panel de formulario ── */}
        <section className="dc-form-pane">
          <form
            className="dc-form-box"
            onSubmit={isRegister ? handleRegister : handleLogin}
          >
            {!isRegister && <div className="dc-eyebrow">Acceso al sistema</div>}

            <h1 className="dc-title">
              {isRegister
                ? <>Crea tu <em>cuenta</em></>
                : <>Bienvenido</>}
            </h1>
            <p className="dc-sub">
              {isRegister
                ? 'Completa los datos para solicitar acceso.'
                : 'Inicia sesión para empezar tu turno.'}
            </p>

            {isRegister ? (
              <>
                <label className="dc-label" htmlFor="r-email">Correo electrónico</label>
                <div className={`dc-field${rEmailError ? ' is-error' : ''}`}>
                  <MailSvg />
                  <input
                    id="r-email" type="email" autoComplete="email"
                    placeholder="tu@doblechevron.com"
                    value={rEmail}
                    onChange={e => setREmail(e.target.value)}
                  />
                </div>
                {rEmailError && <p className="dc-field-error">{rEmailError}</p>}

                <label className="dc-label" htmlFor="r-name">Nombre y apellido</label>
                <div className="dc-field">
                  <UserSvg />
                  <input
                    id="r-name" type="text" placeholder="Juan Pérez"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                </div>

                <label className="dc-label" htmlFor="r-rut">RUT</label>
                <div className="dc-field">
                  <IdSvg />
                  <input
                    id="r-rut" type="text" placeholder="12.345.678-9"
                    value={rut}
                    onChange={e => setRut(e.target.value)}
                  />
                </div>

                <label className="dc-label" htmlFor="r-pass">Contraseña</label>
                <div className={`dc-field${rPasswordError ? ' is-error' : ''}`}>
                  <LockSvg />
                  <input
                    id="r-pass"
                    type={showRPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Mínimo 6 caracteres"
                    value={rPassword}
                    onChange={e => setRPassword(e.target.value)}
                  />
                  <button
                    type="button" className="dc-eye-btn"
                    onClick={() => setShowRPassword(v => !v)}
                  >
                    {showRPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </div>

                <label className="dc-label" htmlFor="r-confirm">Confirmar contraseña</label>
                <div className="dc-field">
                  <LockSvg />
                  <input
                    id="r-confirm"
                    type={showRPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
                {rPasswordError && <p className="dc-field-error">{rPasswordError}</p>}
              </>
            ) : (
              <>
                <label className="dc-label" htmlFor="email">Correo electrónico</label>
                <div className={`dc-field${emailError ? ' is-error' : ''}`}>
                  <MailSvg />
                  <input
                    id="email" type="email" autoComplete="email"
                    placeholder="tu@doblechevron.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                {emailError && <p className="dc-field-error">{emailError}</p>}

                <label className="dc-label" htmlFor="password">Contraseña</label>
                <div className={`dc-field${passwordError ? ' is-error' : ''}`}>
                  <LockSvg />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button
                    type="button" className="dc-eye-btn"
                    onClick={() => setShowPassword(v => !v)}
                  >
                    {showPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
                {passwordError && <p className="dc-field-error">{passwordError}</p>}

                <div className="dc-row">
                  <label className="dc-remember">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={e => setRemember(e.target.checked)}
                    />
                    Recordarme
                  </label>
                  <a className="dc-forgot" href="#">¿Olvidaste tu contraseña?</a>
                </div>
              </>
            )}

            {error && <div className="dc-error-global">{error}</div>}

            <button type="submit" className="dc-submit" disabled={submitting}>
              {submitting && <span className="dc-spinner" />}
              {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
            </button>
          </form>
        </section>
      </main>
    </>
  )
}

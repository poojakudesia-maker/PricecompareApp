import { useEffect, useRef, useState, type FormEvent } from 'react';
import { LogoMark } from './Logo';
import { BackIcon } from './Icons';
import { api, ApiError } from '../api';
import { session } from '../lib/session';

/** Same rule as the server: 10 digits starting 6–9. */
const validMobile = (d: string) => /^[6-9]\d{9}$/.test(d);

function mobileHint(d: string): string | null {
  if (!d) return null;
  if (!/^[6-9]/.test(d)) return 'Indian mobile numbers start with 6, 7, 8 or 9.';
  return null;
}

export function Login() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [digits, setDigits] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | undefined>();
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    setTouched(true);
    if (!validMobile(digits) || busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api.sendOtp(digits);
      setDevOtp(r.devOtp);
      setResendIn(r.resendIn);
      setStep('otp');
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  const hint = mobileHint(digits) ?? (touched && digits.length < 10 ? 'Enter all 10 digits.' : null);

  return (
    <main className="auth">
      <div className="auth__top">
        <LogoMark size={48} />
        <h1>
          {step === 'phone' ? (
            <>
              Welcome to Quick<em>Hai</em>
            </>
          ) : (
            'Enter the OTP'
          )}
        </h1>
        <p>
          {step === 'phone'
            ? 'Log in with your mobile number to compare prices across 5 apps.'
            : `We sent a 6-digit code to +91 ${digits.slice(0, 5)} ${digits.slice(5)}.`}
        </p>
      </div>

      {step === 'phone' ? (
        <form className="auth__card" onSubmit={send} key="phone" noValidate>
          <label className="field__label" htmlFor="qh-phone">
            Mobile number
          </label>
          <div className={`phone ${hint ? 'has-error' : ''} ${validMobile(digits) ? 'is-valid' : ''}`}>
            <span className="phone__cc">🇮🇳 +91</span>
            <input
              id="qh-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="98765 43210"
              autoFocus
              value={digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits}
              onChange={(e) => {
                let d = e.target.value.replace(/\D/g, '');
                // Pasted or autofilled numbers often carry +91 or a leading 0.
                if (d.length > 10 && d.startsWith('91')) d = d.slice(2);
                else if (d.length > 10 && d.startsWith('0')) d = d.slice(1);
                setDigits(d.slice(0, 10));
                setError(null);
              }}
              onBlur={() => digits && setTouched(true)}
            />
          </div>
          <p className={`field__msg ${hint || error ? 'is-error' : ''}`} role="alert">
            {error ?? hint ?? "We'll send you a one-time code. No spam."}
          </p>
          <button className="btn btn--block" disabled={!validMobile(digits) || busy}>
            {busy ? <span className="spinner" /> : 'Get OTP'}
          </button>
        </form>
      ) : (
        <OtpStep
          phone={digits}
          devOtp={devOtp}
          resendIn={resendIn}
          sendError={error}
          onBack={() => {
            setStep('phone');
            setError(null);
          }}
          onResend={() => send()}
        />
      )}

      <p className="auth__legal">QuickHai only compares prices. We don't sell anything or take payments.</p>
    </main>
  );
}

function OtpStep(props: {
  phone: string;
  devOtp?: string;
  resendIn: number;
  sendError: string | null;
  onBack: () => void;
  onResend: () => void;
}) {
  const { phone, devOtp, resendIn, sendError, onBack, onResend } = props;
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Android Chrome can read the code from the SMS automatically (WebOTP).
  // Requires the SMS to end with "@<your-domain> #<code>".
  useEffect(() => {
    if (!('OTPCredential' in window)) return;
    const ctrl = new AbortController();
    navigator.credentials
      .get({ otp: { transport: ['sms'] }, signal: ctrl.signal } as CredentialRequestOptions)
      .then((c) => {
        const code = (c as unknown as { code?: string } | null)?.code;
        if (code) setOtp(code);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    if (otp.length !== 6 || busy) return;
    setBusy(true);
    setError(null);
    api
      .verifyOtp(phone, otp)
      .then(({ token, user }) => session.login(token, user))
      .catch((err: ApiError) => {
        setError(err.message);
        setShake((s) => s + 1);
        setOtp('');
        inputRef.current?.focus();
      })
      .finally(() => setBusy(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  return (
    <div className="auth__card" key="otp">
      <button className="link link--back" onClick={onBack}>
        <BackIcon size={16} /> Change number
      </button>

      {devOtp && (
        <div className="devotp">
          Dev mode: no SMS is sent. Your code is <b>{devOtp}</b>
        </div>
      )}

      <label className={`otp ${error ? 'has-error' : ''}`} key={shake} data-shake={shake > 0 || undefined}>
        <input
          ref={inputRef}
          className="otp__input"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          aria-label="6-digit OTP"
          value={otp}
          disabled={busy}
          onChange={(e) => {
            setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
            setError(null);
          }}
        />
        {Array.from({ length: 6 }, (_, i) => (
          <span
            key={i}
            className={`otp__box ${otp[i] ? 'is-filled' : ''} ${i === Math.min(otp.length, 5) && !busy ? 'is-current' : ''}`}
            aria-hidden="true"
          >
            {otp[i] ?? ''}
          </span>
        ))}
      </label>

      <p className={`field__msg ${error || sendError ? 'is-error' : ''}`} role="alert">
        {busy ? 'Verifying…' : error ?? sendError ?? 'The code is valid for 5 minutes.'}
      </p>

      <div className="otp__resend">
        {resendIn > 0 ? (
          <span>Resend code in 0:{String(resendIn).padStart(2, '0')}</span>
        ) : (
          <button className="link" onClick={onResend}>
            Resend code
          </button>
        )}
      </div>
    </div>
  );
}

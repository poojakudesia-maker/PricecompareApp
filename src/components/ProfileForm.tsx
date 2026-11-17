import { useState, type FormEvent } from 'react';
import { BackIcon } from './Icons';
import { api, ApiError } from '../api';
import { session, useSession } from '../lib/session';
import { go } from '../lib/router';

type Field = 'name' | 'email' | 'pincode';

function validate(v: Record<Field, string>): Partial<Record<Field, string>> {
  const e: Partial<Record<Field, string>> = {};
  if (v.name.trim().length < 2) e.name = 'Enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.email.trim())) e.email = 'Enter a valid email, like you@gmail.com.';
  if (!/^[1-9]\d{5}$/.test(v.pincode)) e.pincode = 'Pincodes have 6 digits and don’t start with 0.';
  return e;
}

/** mode 'setup' is the one-time screen after first login; 'edit' is reached from the avatar. */
export function ProfileForm({ mode }: { mode: 'setup' | 'edit' }) {
  const { user } = useSession();
  const p = user?.profile;
  const [values, setValues] = useState<Record<Field, string>>({
    name: p?.name ?? '',
    email: p?.email ?? '',
    pincode: p?.pincode ?? '',
  });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const errors = validate(values);
  const valid = Object.keys(errors).length === 0;
  const show = (f: Field) => (touched[f] ? errors[f] : undefined);

  const set = (f: Field, v: string) => {
    setValues((s) => ({ ...s, [f]: v }));
    setError(null);
    setSaved(false);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, pincode: true });
    if (!valid || busy) return;
    setBusy(true);
    try {
      const { user } = await api.saveProfile(values);
      session.setUser(user);
      if (mode === 'edit') setSaved(true);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  const input = (f: Field, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="field">
      <label className="field__label" htmlFor={`qh-${f}`}>
        {label}
      </label>
      <input
        id={`qh-${f}`}
        className={`input ${show(f) ? 'has-error' : ''} ${touched[f] && !errors[f] ? 'is-valid' : ''}`}
        value={values[f]}
        onChange={(e) => set(f, f === 'pincode' ? e.target.value.replace(/\D/g, '').slice(0, 6) : e.target.value)}
        onBlur={() => setTouched((t) => ({ ...t, [f]: true }))}
        {...props}
      />
      {show(f) && <p className="field__msg is-error">{show(f)}</p>}
    </div>
  );

  return (
    <main className={`profile profile--${mode}`}>
      {mode === 'edit' ? (
        <div className="topbar">
          <button className="iconbtn" onClick={go.home} aria-label="Back">
            <BackIcon />
          </button>
          <span className="topbar__title">Your profile</span>
          <span style={{ width: 42 }} />
        </div>
      ) : (
        <div className="profile__intro">
          <span className="profile__step">Step 2 of 2</span>
          <h1>Tell us about you</h1>
          <p>Your pincode decides which dark stores, and so which prices, we show you.</p>
        </div>
      )}

      {mode === 'edit' && user && (
        <div className="profile__card">
          <span className="avatar avatar--lg">{(p?.name ?? '?').charAt(0).toUpperCase()}</span>
          <div>
            <strong>{p?.name}</strong>
            <span>
              +91 {user.phone.slice(0, 5)} {user.phone.slice(5)}
            </span>
          </div>
        </div>
      )}

      <form className="auth__card" onSubmit={submit} noValidate>
        {input('name', 'Full name', { autoComplete: 'name', placeholder: 'Priya Sharma', autoFocus: mode === 'setup', maxLength: 60 })}
        {input('email', 'Gmail address', { type: 'email', autoComplete: 'email', inputMode: 'email', placeholder: 'you@gmail.com', maxLength: 120 })}
        {input('pincode', 'Delivery pincode', { inputMode: 'numeric', autoComplete: 'postal-code', placeholder: '560001' })}
        {error && <p className="field__msg is-error">{error}</p>}
        <button className="btn btn--block" disabled={busy}>
          {busy ? <span className="spinner" /> : saved ? 'Saved ✓' : mode === 'setup' ? 'Save and start comparing' : 'Save changes'}
        </button>
      </form>

      {mode === 'edit' && (
        <button
          className="btn btn--ghost btn--block"
          onClick={() => {
            session.logout();
            location.hash = '#/';
          }}
        >
          Log out
        </button>
      )}
    </main>
  );
}

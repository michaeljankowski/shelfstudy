import { useState } from 'react';
import type { Provider } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import './AuthPage.css';

type AuthMode = 'sign-in' | 'sign-up';
type AuthNotice = { kind: 'error' | 'success'; text: string } | null;

type AuthPageProps = {
  passwordRecovery?: boolean;
  onPasswordRecovered?: () => void;
};

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="auth-provider-mark" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.86A6 6 0 0 1 6.07 12c0-.65.11-1.28.32-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.48l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 6.01c1.47 0 2.79.5 3.83 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg aria-hidden="true" className="auth-provider-mark" viewBox="0 0 24 24">
      <path fill="currentColor" d="M16.68 12.86c.02-2.1 1.72-3.11 1.8-3.16a3.87 3.87 0 0 0-3.05-1.65c-1.28-.14-2.52.77-3.17.77-.66 0-1.65-.76-2.72-.74a4.03 4.03 0 0 0-3.4 2.07c-1.47 2.54-.37 6.28 1.03 8.33.7 1 1.51 2.12 2.58 2.08 1.04-.04 1.43-.67 2.69-.67 1.24 0 1.61.67 2.7.65 1.13-.02 1.84-1.01 2.51-2.02a8.3 8.3 0 0 0 1.15-2.34 3.62 3.62 0 0 1-2.12-3.32ZM14.6 6.69a3.68 3.68 0 0 0 .84-2.65 3.74 3.74 0 0 0-2.42 1.26 3.52 3.52 0 0 0-.86 2.55 3.1 3.1 0 0 0 2.44-1.16Z" />
    </svg>
  );
}

export default function AuthPage({ passwordRecovery = false, onPasswordRecovered }: AuthPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [notice, setNotice] = useState<AuthNotice>(null);
  const [busyAction, setBusyAction] = useState<'password' | Provider | 'reset' | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusyAction('password');
    setNotice(null);

    if (passwordRecovery) {
      if (password !== passwordConfirmation) {
        setBusyAction(null);
        setNotice({ kind: 'error', text: 'Passwords must match.' });
        return;
      }
      const { error } = await supabase.auth.updateUser({ password });
      setBusyAction(null);
      if (error) setNotice({ kind: 'error', text: error.message });
      else onPasswordRecovered?.();
      return;
    }

    const result = mode === 'sign-in'
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password });

    setBusyAction(null);
    if (result.error) {
      setNotice({ kind: 'error', text: result.error.message });
    } else if (mode === 'sign-up' && !result.data.session) {
      setNotice({ kind: 'success', text: 'Check your email to confirm your account.' });
    }
  };

  const signInWithProvider = async (provider: Extract<Provider, 'google' | 'apple'>) => {
    setBusyAction(provider);
    setNotice(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setNotice({ kind: 'error', text: error.message });
      setBusyAction(null);
    }
  };

  const sendPasswordReset = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setNotice({ kind: 'error', text: 'Enter your email address first.' });
      return;
    }

    setBusyAction('reset');
    setNotice(null);
    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: window.location.origin,
    });
    setBusyAction(null);
    setNotice(error
      ? { kind: 'error', text: error.message }
      : { kind: 'success', text: 'Password reset instructions are on the way.' });
  };

  const changeMode = () => {
    setMode((current) => current === 'sign-in' ? 'sign-up' : 'sign-in');
    setPassword('');
    setNotice(null);
  };

  const busy = busyAction !== null;

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-heading">
        <header className="auth-brand">
          <div className="auth-brand-mark" aria-hidden="true">S</div>
          <p className="auth-wordmark">ShelfStudy</p>
        </header>

        <div className="auth-heading-group">
          <p className="auth-eyebrow">Your study workspace</p>
          <h1 id="auth-heading">{passwordRecovery ? 'Choose a new password.' : mode === 'sign-in' ? 'Welcome back.' : 'Create your account.'}</h1>
          <p>
            {passwordRecovery
              ? 'Use at least eight characters, then return to your ShelfStudy workspace.'
              : mode === 'sign-in'
              ? 'Return to your classes, source material, and saved study sessions.'
              : 'Keep your notes and study progress together in one focused workspace.'}
          </p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {!passwordRecovery && (
            <>
              <label htmlFor="auth-email">Email address</label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={busy}
                required
              />
            </>
          )}

          <div className="auth-password-label">
            <label htmlFor="auth-password">{passwordRecovery ? 'New password' : 'Password'}</label>
            {!passwordRecovery && mode === 'sign-in' && (
              <button type="button" className="auth-text-button" onClick={sendPasswordReset} disabled={busy}>
                Forgot password?
              </button>
            )}
          </div>
          <input
            id="auth-password"
            type="password"
            autoComplete={passwordRecovery || mode === 'sign-up' ? 'new-password' : 'current-password'}
            placeholder={passwordRecovery || mode === 'sign-up' ? 'At least 8 characters' : 'Enter your password'}
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={busy}
            required
          />

          {passwordRecovery && (
            <>
              <label className="auth-confirm-label" htmlFor="auth-password-confirmation">Confirm new password</label>
              <input
                id="auth-password-confirmation"
                type="password"
                autoComplete="new-password"
                placeholder="Enter it again"
                minLength={8}
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                disabled={busy}
                required
              />
            </>
          )}

          {notice && (
            <p className={`auth-notice ${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>
              {notice.text}
            </p>
          )}

          <button className="auth-submit" type="submit" disabled={busy}>
            {busyAction === 'password'
              ? 'Please wait…'
              : passwordRecovery ? 'Save new password' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {!passwordRecovery && <div className="auth-divider"><span>or continue with</span></div>}

        {!passwordRecovery && <div className="auth-providers" aria-label="Social sign in options">
          <button type="button" className="auth-provider" onClick={() => signInWithProvider('google')} disabled={busy}>
            <GoogleMark />
            <span>{busyAction === 'google' ? 'Connecting…' : 'Google'}</span>
          </button>
          <button type="button" className="auth-provider" onClick={() => signInWithProvider('apple')} disabled={busy}>
            <AppleMark />
            <span>{busyAction === 'apple' ? 'Connecting…' : 'Apple'}</span>
          </button>
        </div>}

        {!passwordRecovery && <p className="auth-switch-copy">
          {mode === 'sign-in' ? 'New to ShelfStudy?' : 'Already have an account?'}{' '}
          <button type="button" className="auth-text-button" onClick={changeMode} disabled={busy}>
            {mode === 'sign-in' ? 'Create an account' : 'Sign in'}
          </button>
        </p>}

        <p className="auth-terms">By continuing, you agree to use ShelfStudy for your own learning materials.</p>
      </section>
      <aside className="auth-context" aria-label="ShelfStudy product overview">
        <div>
          <p className="auth-context-kicker">Built around your sources</p>
          <h2>Study what you actually need to know.</h2>
          <p>Organize class material, build a plan, and return to the same conversation whenever you are ready.</p>
        </div>
        <p className="auth-context-note">Your workspace stays private to your account.</p>
      </aside>
    </main>
  );
}

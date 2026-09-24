import { useState } from 'react';
import { supabase } from '../config/supabase';
import './AuthPage.css';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const result = mode === 'sign-in'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (result.error) setMessage(result.error.message);
    else if (mode === 'sign-up' && !result.data.session) setMessage('Check your email to confirm your account.');
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="auth-wordmark">ShelfStudy</p>
        <h1>{mode === 'sign-in' ? 'Welcome back' : 'Create your study space'}</h1>
        <p>Your classes, sources, and study conversations stay attached to your account.</p>
        <form onSubmit={submit}>
          <label>Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Password<input type="password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {message && <p className="auth-message" role="status">{message}</p>}
          <button disabled={busy}>{busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}</button>
        </form>
        <button className="auth-switch" onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setMessage(''); }}>
          {mode === 'sign-in' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
        </button>
      </section>
    </main>
  );
}

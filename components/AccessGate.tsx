import { useState } from 'react';
import { IconShield } from './icons';
import PasswordInput from './PasswordInput';
import { registerAccount, loginAccount } from '../lib/guest';

export default function AccessGate({ onDone }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function switchMode(nextMode) {
    setMode(nextMode);
    setError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!username.trim()) {
      setError('Foydalanuvchi nomini kiriting');
      return;
    }
    if (!password || password.length < 4) {
      setError("Parol kamida 4 ta belgidan iborat bo'lishi kerak");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      if (mode === 'register') {
        await registerAccount(username, password);
      } else {
        await loginAccount(username, password);
      }
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="game-hero">
      <div className="game-card access-gate-card">
        <div className="game-icon-badge">
          <IconShield size={22} />
        </div>
        <h3>Davom etishdan oldin</h3>
        <p className="muted">
          Test yechish va o'yin o'ynash uchun hisobingiz kerak. Ro'yxatdan o'ting yoki avval yaratgan
          hisobingizga kiring — istalgan qurilmadan foydalanish mumkin.
        </p>

        <div className="method-tabs">
          <button
            type="button"
            className={`method-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Kirish
          </button>
          <button
            type="button"
            className={`method-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}
          >
            Ro'yxatdan o'tish
          </button>
        </div>

        <form onSubmit={handleSubmit} className="access-gate-form">
          <input
            className="form-input"
            placeholder="Foydalanuvchi nomi"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
          />
          <PasswordInput
            placeholder="Parol"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          />
          {error && <p className="profile-photo-error">{error}</p>}
          <button className="pill-btn primary" type="submit" disabled={submitting}>
            {submitting ? 'Yuborilmoqda...' : mode === 'register' ? "Ro'yxatdan o'tish" : 'Kirish'}
          </button>
        </form>
      </div>
    </div>
  );
}

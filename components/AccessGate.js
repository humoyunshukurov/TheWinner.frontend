import { useState } from 'react';
import { IconShield } from './icons';
import { registerGuest } from '../lib/guest';

export default function AccessGate({ onDone }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);

  function handleSubmit(event) {
    event.preventDefault();

    if (!name.trim()) {
      setError('Ismingizni kiriting');
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError("Kod aynan 6 ta raqamdan iborat bo'lishi kerak");
      return;
    }

    setError(null);
    registerGuest(name, code);
    onDone();
  }

  return (
    <div className="game-hero">
      <div className="game-card access-gate-card">
        <div className="game-icon-badge">
          <IconShield size={22} />
        </div>
        <h3>Davom etishdan oldin</h3>
        <p className="muted">
          Test yechish va o'yin o'ynash uchun ismingiz va 6 xonali shaxsiy kodingiz kerak. Kodni o'zingiz
          tanlaysiz — uni eslab qoling, keyinroq shu kod bilan natijalaringizga qaytasiz.
        </p>

        <form onSubmit={handleSubmit} className="access-gate-form">
          <input
            className="form-input"
            placeholder="Ismingiz"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <input
            className="form-input"
            placeholder="6 xonali kod (masalan: 482910)"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
          />
          {error && <p className="profile-photo-error">{error}</p>}
          <button className="pill-btn primary" type="submit">
            Davom etish
          </button>
        </form>
      </div>
    </div>
  );
}

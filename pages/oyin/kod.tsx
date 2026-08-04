import { useState } from 'react';
import Layout from '../../components/Layout';
import { IconPlay } from '../../components/icons';
import { useRequireAccess } from '../../lib/useRequireAccess';

export default function KodOyinPage() {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState(null);
  const { requireAccess } = useRequireAccess();

  function showPlaceholder(event) {
    if (event) event.preventDefault();
    requireAccess(() => {
      setMessage("Hozircha faol o'yin yo'q. Admin panel testni ishga tushirganda, shu yerdan qo'shilasiz.");
    });
  }

  return (
    <Layout eyebrow="Guruh bilan birga o'ynang" title="Kod bilan qo'shilish" backHref="/oyin">
      <div className="game-hero">
        <div className="game-card">
          <button className="game-icon-badge" onClick={showPlaceholder} aria-label="Boshlash">
            <IconPlay size={26} />
          </button>

          <h3>O'yinni boshlash</h3>
          <p className="muted">Guruh bilan birga real vaqtda bilim sinovidan o'ting</p>

          <form className="game-code-form" onSubmit={showPlaceholder}>
            <input
              type="text"
              className="game-code-input"
              placeholder="Kodni kiriting"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              maxLength={6}
            />
          </form>

          {message && <p className="game-message">{message}</p>}
        </div>
      </div>
    </Layout>
  );
}

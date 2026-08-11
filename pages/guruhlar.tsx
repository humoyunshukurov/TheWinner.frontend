import { useEffect, useState, type FormEvent } from 'react';
import Layout from '../components/Layout';
import { IconUsers } from '../components/icons';
import { getGuest } from '../lib/guest';
import { useRequireAccess } from '../lib/useRequireAccess';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function GuruhlarPage() {
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<{ group: string; membersCount: number } | null>(null);
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { requireAccess } = useRequireAccess();

  function loadMyGroup() {
    const { guestId } = getGuest();
    setLoading(true);
    fetch(`${API_URL}/groups/mine?guestId=${guestId}`)
      .then((res) => res.json())
      .then((data) => setGroup(data.group ? data : null))
      .catch(() => setGroup(null))
      .finally(() => setLoading(false));
  }

  useEffect(loadMyGroup, []);

  function submitJoin(event?: FormEvent) {
    if (event) event.preventDefault();
    requireAccess(doJoin);
  }

  function doJoin() {
    const trimmed = code.trim();
    if (!trimmed) return;

    setJoining(true);
    setError(null);
    const { guestId, name } = getGuest();

    fetch(`${API_URL}/groups/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId, name, code: trimmed })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Xatolik yuz berdi');
        return data;
      })
      .then(() => {
        setJoining(false);
        setCode('');
        loadMyGroup();
      })
      .catch((err) => {
        setJoining(false);
        setError(err.message);
      });
  }

  function leaveGroup() {
    const { guestId } = getGuest();
    fetch(`${API_URL}/groups/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId })
    }).then(loadMyGroup);
  }

  return (
    <Layout eyebrow="Sinfdoshlaringiz bilan birga" title="Guruhlar">
      {loading && <p className="muted">Yuklanmoqda...</p>}

      {!loading && group?.group && (
        <div className="game-hero">
          <div className="game-card">
            <div className="game-icon-badge" style={{ cursor: 'default' }}>
              <IconUsers size={26} />
            </div>

            <h3>{group.group}</h3>
            <p className="muted">
              Siz shu guruhga a&apos;zosiz &middot; {group.membersCount} a&apos;zo
            </p>

            <button type="button" className="link-more" onClick={leaveGroup}>
              Boshqa kod bilan qo&apos;shilish
            </button>
          </div>
        </div>
      )}

      {!loading && !group?.group && (
        <div className="game-hero">
          <div className="game-card">
            <button className="game-icon-badge" onClick={() => submitJoin()} aria-label="Qo'shilish">
              <IconUsers size={26} />
            </button>

            <h3>Guruhsiz</h3>
            <p className="muted">O&apos;qituvchingiz bergan qo&apos;shilish kodini kiriting</p>

            <form className="game-code-form" onSubmit={submitJoin}>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                className="game-code-input"
                placeholder="000000"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                maxLength={6}
              />
            </form>

            {joining && <p className="game-message">Qo&apos;shilinmoqda...</p>}
            {error && <p className="game-message">{error}</p>}
          </div>
        </div>
      )}
    </Layout>
  );
}

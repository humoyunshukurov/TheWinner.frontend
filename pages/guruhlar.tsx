import { useEffect, useState, type FormEvent } from 'react';
import Layout from '../components/Layout';
import { IconUsers } from '../components/icons';
import { getGuest } from '../lib/guest';
import { useRequireAccess } from '../lib/useRequireAccess';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function GuruhlarPage() {
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<{ group: string; type?: string; membersCount: number } | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
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

  useEffect(() => {
    loadMyGroup();
  }, []);

  function submitJoin(event?: FormEvent) {
    if (event) event.preventDefault();
    requireAccess(doJoin);
  }

  function doJoin() {
    const trimmed = joinCode.trim();
    if (!trimmed) return;

    setJoining(true);
    setJoinError(null);
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
        setJoinCode('');
        loadMyGroup();
      })
      .catch((err) => {
        setJoining(false);
        setJoinError(err.message);
      });
  }

  function leaveGroup() {
    const { guestId } = getGuest();
    fetch(`${API_URL}/groups/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId })
    }).then(() => {
      loadMyGroup();
    });
  }

  return (
    <Layout title="Guruhlar">
      {loading && <p className="muted">Yuklanmoqda...</p>}

      {!loading && group?.group && (
        <article className="card">
          <div className="profile-photo-row">
            <div className="game-icon-badge" style={{ cursor: 'default', width: 56, height: 56, borderRadius: 16 }}>
              <IconUsers size={22} />
            </div>
            <div>
              {group.type && <span className="tag">{group.type}</span>}
              <strong style={{ fontSize: '1.1rem', display: 'block', marginTop: group.type ? 4 : 0 }}>
                {group.group}
              </strong>
              <p className="muted" style={{ margin: '2px 0 0' }}>
                Siz shu guruhga a&apos;zosiz &middot; {group.membersCount} a&apos;zo
              </p>
            </div>
          </div>
          <button type="button" className="link-more" onClick={leaveGroup}>
            Boshqa kod bilan qo&apos;shilish
          </button>
        </article>
      )}

      {!loading && !group?.group && (
        <article className="card">
          <div className="card-header">
            <h3>Guruhga qo&apos;shilish</h3>
          </div>
          <p className="muted">O&apos;qituvchingiz bergan 6 xonali qo&apos;shilish kodini kiriting.</p>

          <form className="game-code-form" onSubmit={submitJoin} style={{ marginTop: 16 }}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              className="game-code-input"
              placeholder="000000"
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.replace(/\D/g, ''))}
              maxLength={6}
            />
          </form>

          {joining && <p className="game-message">Qo&apos;shilinmoqda...</p>}
          {joinError && <p className="game-message">{joinError}</p>}

          <button
            type="button"
            className="pill-btn primary"
            style={{ marginTop: 14 }}
            onClick={() => submitJoin()}
            disabled={joining || !joinCode.trim()}
          >
            Qo&apos;shilish
          </button>
        </article>
      )}
    </Layout>
  );
}

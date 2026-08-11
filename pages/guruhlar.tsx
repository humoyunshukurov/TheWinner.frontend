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
  const [allGroups, setAllGroups] = useState<any[] | null>(null);
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

  function loadAllGroups() {
    fetch(`${API_URL}/groups`)
      .then((res) => res.json())
      .then(setAllGroups)
      .catch(() => setAllGroups([]));
  }

  useEffect(() => {
    loadMyGroup();
    loadAllGroups();
  }, []);

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
        loadAllGroups();
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
    }).then(() => {
      loadMyGroup();
      loadAllGroups();
    });
  }

  return (
    <Layout eyebrow="Sinfdoshlaringiz bilan birga" title="Guruhlar">
      {loading && <p className="muted">Yuklanmoqda...</p>}

      {!loading && group?.group && (
        <article className="card">
          <div className="profile-photo-row">
            <div className="game-icon-badge" style={{ cursor: 'default', width: 56, height: 56, borderRadius: 16 }}>
              <IconUsers size={22} />
            </div>
            <div>
              <strong style={{ fontSize: '1.1rem' }}>{group.group}</strong>
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

      <article className="card" style={{ marginTop: 18 }}>
        <div className="card-header">
          <h3>Mavjud guruhlar</h3>
          <span className="select-chip">{allGroups?.length || 0} ta</span>
        </div>

        {allGroups === null && <p className="muted">Yuklanmoqda...</p>}
        {allGroups?.length === 0 && <p className="muted">Hali guruh yaratilmagan</p>}

        {allGroups && allGroups.length > 0 && (
          <ul className="group-directory-list">
            {allGroups.map((g) => (
              <li key={g.name} className={`group-directory-item ${group?.group === g.name ? 'mine' : ''}`}>
                <div className="group-directory-icon">
                  <IconUsers size={16} />
                </div>
                <div className="group-directory-main">
                  <strong>{g.name}</strong>
                  {g.createdBy && <span className="muted">{g.createdBy} tomonidan</span>}
                </div>
                <span className="muted">{g.membersCount} a&apos;zo</span>
              </li>
            ))}
          </ul>
        )}

        <p className="muted" style={{ fontSize: '0.78rem', marginTop: 14, marginBottom: 0 }}>
          Qo&apos;shilish kodi bu yerda ko&apos;rsatilmaydi &mdash; uni o&apos;qituvchingizdan so&apos;rang.
        </p>
      </article>
    </Layout>
  );
}

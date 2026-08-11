import { useEffect, useState, type FormEvent } from 'react';
import Layout from '../components/Layout';
import { IconUsers } from '../components/icons';
import { getGuest } from '../lib/guest';
import { useRequireAccess } from '../lib/useRequireAccess';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function GuruhlarPage() {
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<{ group: string; membersCount: number } | null>(null);
  const [allGroups, setAllGroups] = useState<any[] | null>(null);
  const [joinTarget, setJoinTarget] = useState<string | null>(null);
  const [modalCode, setModalCode] = useState('');
  const [modalJoining, setModalJoining] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
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

  function openJoinModal(groupName: string) {
    setJoinTarget(groupName);
    setModalCode('');
    setModalError(null);
  }

  function closeJoinModal() {
    if (modalJoining) return;
    setJoinTarget(null);
  }

  function submitModalJoin(event?: FormEvent) {
    if (event) event.preventDefault();
    requireAccess(doModalJoin);
  }

  function doModalJoin() {
    const trimmed = modalCode.trim();
    if (!trimmed) return;

    setModalJoining(true);
    setModalError(null);
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
        setModalJoining(false);
        setJoinTarget(null);
        loadMyGroup();
        loadAllGroups();
      })
      .catch((err) => {
        setModalJoining(false);
        setModalError(err.message);
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

      <article className="card" style={{ marginTop: 18 }}>
        <div className="card-header">
          <h3>Mavjud guruhlar</h3>
          <span className="select-chip">{allGroups?.length || 0} ta</span>
        </div>

        {allGroups === null && <p className="muted">Yuklanmoqda...</p>}
        {allGroups?.length === 0 && <p className="muted">Hali guruh yaratilmagan</p>}

        {allGroups && allGroups.length > 0 && (
          <ul className="group-directory-list">
            {allGroups.map((g) => {
              const mine = group?.group === g.name;
              return (
                <li key={g.name}>
                  <button
                    type="button"
                    className={`group-directory-item ${mine ? 'mine' : ''}`}
                    onClick={() => openJoinModal(g.name)}
                    disabled={mine}
                  >
                    <div className="group-directory-icon">
                      <IconUsers size={16} />
                    </div>
                    <div className="group-directory-main">
                      <strong>{g.name}</strong>
                      {g.createdBy && <span className="muted">{g.createdBy} tomonidan</span>}
                    </div>
                    <span className="muted">{mine ? "Siz a'zosiz" : `${g.membersCount} a'zo`}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <p className="muted" style={{ fontSize: '0.78rem', marginTop: 14, marginBottom: 0 }}>
          Qo&apos;shilish kodi bu yerda ko&apos;rsatilmaydi &mdash; uni o&apos;qituvchingizdan so&apos;rang.
        </p>
      </article>

      {joinTarget && (
        <div className="modal-overlay" onClick={closeJoinModal}>
          <div className="modal-box" onClick={(event) => event.stopPropagation()}>
            <div
              className="game-icon-badge"
              style={{ cursor: 'default', width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px' }}
            >
              <IconUsers size={22} />
            </div>
            <h3>{joinTarget}</h3>
            <p className="muted">Ushbu guruhga qo&apos;shilish uchun kodni kiriting</p>

            <form className="game-code-form" onSubmit={submitModalJoin} style={{ marginTop: 16 }}>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                autoFocus
                className="game-code-input"
                placeholder="000000"
                value={modalCode}
                onChange={(event) => setModalCode(event.target.value.replace(/\D/g, ''))}
                maxLength={6}
              />
            </form>

            {modalJoining && <p className="game-message">Qo&apos;shilinmoqda...</p>}
            {modalError && <p className="game-message">{modalError}</p>}

            <div className="modal-actions">
              <button type="button" className="pill-btn" onClick={closeJoinModal} disabled={modalJoining}>
                Bekor qilish
              </button>
              <button type="button" className="pill-btn primary" onClick={() => submitModalJoin()} disabled={modalJoining}>
                Qo&apos;shilish
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

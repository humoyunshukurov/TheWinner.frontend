import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { IconBell, IconSend, IconPlay, IconUsers } from '../components/icons';
import { getGuest } from '../lib/guest';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function formatTime(ts: number) {
  return new Date(ts).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// Four kinds of thing show up here, merged into one reverse-chron feed -
// (1) taklif threads this guest has sent from Sozlamalar, with whatever
// replies have come back, (2) e'lonlar (announcements) sent to everyone
// or to this guest's group, (3) Kod bilan o'yin takliflari - an admin
// started a live session FOR this guest's group specifically, Ha/Yo'q
// right here decides whether to join, no code typing needed - and (4) a
// one-way notice when an admin adds this guest to a group directly (not
// their own code-join, which they already see happen live). Never shows
// who specifically replied/sent/invited/added (the backend does track
// that internally, but it's deliberately not surfaced here) - every
// message reads as coming from "ma'muriyat" as a whole, not a named
// person.
export default function BildirishnomalarPage() {
  const router = useRouter();
  const [feed, setFeed] = useState<any[] | null>(null);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [inviteResult, setInviteResult] = useState<Record<number, 'accepted' | 'declined' | 'expired'>>({});

  function load() {
    const { guestId } = getGuest();
    Promise.all([
      fetch(`${API_URL}/feedback/mine?guestId=${guestId}`).then((res) => res.json()),
      fetch(`${API_URL}/feedback/announcements?guestId=${guestId}`).then((res) => res.json()),
      fetch(`${API_URL}/kod/invites?guestId=${guestId}`).then((res) => res.json()),
      fetch(`${API_URL}/group-join-notices?guestId=${guestId}`).then((res) => res.json())
    ])
      .then(([mine, announcements, invites, groupJoins]) => {
        const merged = [
          ...mine.map((entry) => ({ type: 'thread', createdAt: entry.createdAt, entry })),
          ...announcements.map((a) => ({ type: 'announcement', createdAt: a.createdAt, entry: a })),
          ...invites.map((inv) => ({ type: 'invite', createdAt: inv.createdAt, entry: inv })),
          ...groupJoins.map((n) => ({ type: 'groupJoin', createdAt: n.createdAt, entry: n }))
        ].sort((a, b) => b.createdAt - a.createdAt);
        setFeed(merged);
      })
      .catch(() => setFeed([]));
  }

  useEffect(() => {
    load();
    const { guestId } = getGuest();
    fetch(`${API_URL}/feedback/mark-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId })
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function respondInvite(invite: any, accept: boolean) {
    setRespondingId(invite.id);
    const { guestId } = getGuest();
    try {
      const res = await fetch(`${API_URL}/kod/invites/${invite.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId, accept })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message);

      if (accept && data.joined) {
        router.push(`/oyin/kod?code=${invite.code}`);
        return;
      }
      setInviteResult((prev) => ({ ...prev, [invite.id]: accept ? 'expired' : 'declined' }));
    } catch {
      setInviteResult((prev) => ({ ...prev, [invite.id]: 'expired' }));
    } finally {
      setRespondingId(null);
    }
  }

  return (
    <Layout title="Bildirishnomalar">
      {!feed && <p className="muted">Yuklanmoqda...</p>}
      {feed?.length === 0 && (
        <article className="card">
          <p className="muted">Hali hech narsa yo&apos;q. Sozlamalar &rsaquo; Taklif yozish.</p>
        </article>
      )}

      {feed && feed.length > 0 && (
        <div className="notif-feed">
          {feed.map((item) => {
            if (item.type === 'invite') {
              const result = inviteResult[item.entry.id];
              return (
                <article key={`i${item.entry.id}`} className="card notif-card">
                  <div className="notif-card-icon invite">
                    <IconPlay size={20} />
                  </div>
                  <div className="notif-card-body">
                    <p>
                      <strong>{item.entry.groupName}</strong> guruhi uchun &quot;Kod bilan o&apos;yin&quot; boshlanmoqda -
                      qo&apos;shilasizmi?
                    </p>
                    <span className="notif-card-time">{formatTime(item.entry.createdAt)}</span>

                    {!result && (
                      <div className="action-row" style={{ marginTop: 10 }}>
                        <button
                          type="button"
                          className="pill-btn primary"
                          onClick={() => respondInvite(item.entry, true)}
                          disabled={respondingId === item.entry.id}
                        >
                          Ha
                        </button>
                        <button
                          type="button"
                          className="pill-btn"
                          onClick={() => respondInvite(item.entry, false)}
                          disabled={respondingId === item.entry.id}
                        >
                          Yo&apos;q
                        </button>
                      </div>
                    )}
                    {result === 'declined' && <p className="muted" style={{ marginTop: 8 }}>Rad etdingiz</p>}
                    {result === 'expired' && (
                      <p className="muted" style={{ marginTop: 8 }}>
                        O&apos;yin allaqachon boshlangan yoki tugagan
                      </p>
                    )}
                  </div>
                </article>
              );
            }

            if (item.type === 'announcement') {
              return (
                <article key={`a${item.entry.id}`} className="card notif-card">
                  <div className="notif-card-icon announcement">
                    <IconBell size={20} />
                  </div>
                  <div className="notif-card-body">
                    <p>{item.entry.text}</p>
                    <span className="notif-card-time">{formatTime(item.entry.createdAt)}</span>
                  </div>
                </article>
              );
            }

            if (item.type === 'groupJoin') {
              return (
                <article key={`g${item.entry.id}`} className="card notif-card">
                  <div className="notif-card-icon groupJoin">
                    <IconUsers size={20} />
                  </div>
                  <div className="notif-card-body">
                    <p>
                      Siz <strong>{item.entry.groupName}</strong> guruhiga qo&apos;shildingiz.
                    </p>
                    <span className="notif-card-time">{formatTime(item.entry.createdAt)}</span>
                  </div>
                </article>
              );
            }

            return (
              <article key={`t${item.entry.id}`} className="card notif-card">
                <div className="notif-card-icon">
                  <IconSend size={20} />
                </div>
                <div className="notif-card-body">
                  <p>{item.entry.text}</p>
                  <span className="notif-card-time">{formatTime(item.entry.createdAt)}</span>

                  {item.entry.replies?.map((reply, i) => (
                    <div key={i} className="notif-reply-block">
                      <p>{reply.text}</p>
                      <span className="notif-card-time">{formatTime(reply.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Layout>
  );
}

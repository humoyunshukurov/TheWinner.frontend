import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { IconClock, IconCoin, IconTrendUp, IconGlobe } from '../components/icons';
import { getGuest } from '../lib/guest';
import { getTotalUsageMs, formatUsageDuration } from '../lib/usage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function HomePage() {
  const [coins, setCoins] = useState(null);
  const [hpData, setHpData] = useState(null);
  const [groupName, setGroupName] = useState(undefined);
  const [groupMembersCount, setGroupMembersCount] = useState(null);
  const [usageText, setUsageText] = useState('');

  useEffect(() => {
    const { guestId } = getGuest();
    fetch(`${API_URL}/coins?guestId=${guestId}`).then((res) => res.json()).then((data) => setCoins(data.coins)).catch(() => {});
    fetch(`${API_URL}/hp?guestId=${guestId}`).then((res) => res.json()).then(setHpData).catch(() => {});
    fetch(`${API_URL}/groups/mine?guestId=${guestId}`)
      .then((res) => res.json())
      .then((data) => {
        setGroupName(data.group ?? null);
        setGroupMembersCount(data.membersCount ?? null);
      })
      .catch(() => setGroupName(null));

    const updateUsage = () => setUsageText(formatUsageDuration(getTotalUsageMs()));
    updateUsage();
    const interval = setInterval(updateUsage, 5000);
    return () => clearInterval(interval);
  }, []);

  const rank = hpData?.rank;
  const progressLabel = rank ? `${hpData.hp} / ${rank.max ?? hpData.hp}` : '...';

  return (
    <Layout eyebrow="Najot Ta'lim akademiyasi" title="Bosh sahifa">
      <article className="card alert-card">
        <div className="alert-icon accent">
          <IconClock size={18} />
        </div>
        <div>
          <strong>Ishlatish muddati</strong>
          <span className="muted-link">{usageText}</span>
        </div>
      </article>

      <article className="card level-card" style={{ marginTop: 14 }}>
        <div className="level-header">
          <h2>Ballarim: {coins !== null ? coins : '...'}</h2>
          <IconCoin size={20} />
        </div>

        <div className="level-row">
          <IconTrendUp size={18} />
          <span className="muted">Bosqich:</span>
          <strong>{rank ? rank.stage : '...'}</strong>
        </div>

        <div className="level-progress-bar">
          <div className="level-progress-fill" style={{ width: `${(rank?.progress ?? 0) * 100}%` }}>
            <span>{progressLabel}</span>
          </div>
        </div>

        <p className="level-caption">
          {rank
            ? rank.hpToNext != null
              ? `Keyingi bosqichgacha ${rank.hpToNext} HP qoldi`
              : "Eng yuqori bosqichdasiz"
            : '...'}
        </p>

        <div className="level-row">
          <IconGlobe size={18} />
          <span className="muted">XP:</span>
          <strong>{hpData ? hpData.hp : '...'}</strong>
        </div>

        <div className="level-divider" />

        <div className="level-row">
          <span className="muted">Guruh:</span>
          <strong>{groupName === undefined ? '...' : groupName || 'Guruhsiz'}</strong>
        </div>
        <div className="level-row" style={{ marginBottom: 0 }}>
          {groupName ? (
            <>
              <span className="muted">A&apos;zolar:</span>
              <strong className="level-rank-value">
                {groupMembersCount != null ? `${groupMembersCount} ta` : '...'}
              </strong>
            </>
          ) : (
            groupName === null && (
              <Link href="/guruhlar" className="link-more">
                Guruhga qo&apos;shilish
              </Link>
            )
          )}
        </div>
      </article>
    </Layout>
  );
}

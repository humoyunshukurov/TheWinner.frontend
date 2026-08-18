import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { IconClock, IconGrid, IconQuiz, IconPlay, IconTrophy, IconUsers, IconGear } from '../components/icons';
import { getGuest } from '../lib/guest';
import { fetchUsage, formatUsageDuration, SECTION_LABELS, type UsageStats } from '../lib/usage';

const REFRESH_MS = 30000;

const SECTION_ICONS = {
  bosh: IconGrid,
  testlar: IconQuiz,
  oyin: IconPlay,
  reyting: IconTrophy,
  guruhlar: IconUsers,
  tarix: IconClock,
  sozlamalar: IconGear,
  boshqa: IconClock
};

export default function VaqtPage() {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [range, setRange] = useState<'today' | 'total'>('today');

  useEffect(() => {
    const { guestId } = getGuest();
    function load() {
      fetchUsage(guestId).then(setUsage);
    }
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const bySection = usage ? (range === 'today' ? usage.todayBySection : usage.totalBySection) : null;
  const totalForRange = usage ? (range === 'today' ? usage.todayMs : usage.totalMs) : 0;
  const rows = bySection
    ? Object.entries(bySection)
        .filter(([, ms]) => ms > 0)
        .sort((a, b) => b[1] - a[1])
    : [];

  return (
    <Layout eyebrow="Qayerda qancha vaqt sarfladingiz?" title="Vaqt" backHref="/">
      <article className="card alert-card">
        <div className="alert-icon accent">
          <IconClock size={22} />
        </div>
        <div>
          <strong>{range === 'today' ? 'Bugun' : 'Jami'}</strong>
          <span className="muted-link">{usage ? formatUsageDuration(totalForRange) : '...'}</span>
        </div>
      </article>

      <article className="card" style={{ marginTop: 14 }}>
        <div className="card-header">
          <h3>Bo&apos;limlar bo&apos;yicha</h3>
        </div>

        <div className="method-tabs">
          <button
            type="button"
            className={`method-tab ${range === 'today' ? 'active' : ''}`}
            onClick={() => setRange('today')}
          >
            Bugun
          </button>
          <button
            type="button"
            className={`method-tab ${range === 'total' ? 'active' : ''}`}
            onClick={() => setRange('total')}
          >
            Jami
          </button>
        </div>

        {!usage && <p className="muted">Yuklanmoqda...</p>}
        {usage && rows.length === 0 && <p className="muted">Hali bu oraliqda hech narsa qayd etilmagan</p>}

        {rows.length > 0 && (
          <div className="usage-section-list">
            {rows.map(([section, ms]) => {
              const Icon = SECTION_ICONS[section] || IconClock;
              const pct = totalForRange ? Math.round((ms / totalForRange) * 100) : 0;
              return (
                <div className="usage-section-row" key={section}>
                  <div className="usage-section-icon">
                    <Icon size={16} />
                  </div>
                  <div className="usage-section-main">
                    <div className="usage-section-top">
                      <strong>{SECTION_LABELS[section] || section}</strong>
                      <span>{formatUsageDuration(ms)}</span>
                    </div>
                    <div className="usage-section-bar">
                      <div className="usage-section-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </article>
    </Layout>
  );
}

import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { IconSwords, IconPlay, IconTrophy, IconTrendUp, IconCoin, IconGlobe } from '../components/icons';
import { getGuest } from '../lib/guest';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Same icon each mode already uses on its own O'yin hub card, for a
// consistent look between "where you play it" and "what you played".
const TYPE_META = {
  duel: { label: '1vs1 Jang', Icon: IconSwords },
  kod: { label: "Kod bilan o'yin", Icon: IconPlay },
  turnir: { label: 'Turnir', Icon: IconTrophy },
  marafon: { label: 'Infinite Quiz', Icon: IconTrendUp }
};

const RESULT_META = {
  win: { label: "G'olib", className: 'win' },
  lose: { label: "Mag'lub", className: 'lose' },
  draw: { label: 'Durang', className: 'draw' }
};

function formatDate(ms: number) {
  return new Date(ms).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function TarixPage() {
  const [history, setHistory] = useState<any[] | null>(null);

  useEffect(() => {
    const { guestId } = getGuest();
    fetch(`${API_URL}/history?guestId=${guestId}`)
      .then((res) => res.json())
      .then(setHistory)
      .catch(() => setHistory([]));
  }, []);

  return (
    <Layout eyebrow="Qaysi o'yinlarni o'ynagansiz?" title="Tarix">
      <article className="card">
        <div className="card-header">
          <h3>O'yinlar tarixi</h3>
          <span className="select-chip">{history?.length || 0} ta</span>
        </div>

        {history === null && <p className="muted">Yuklanmoqda...</p>}
        {history?.length === 0 && <p className="muted">Hali hech qanday o'yin o'ynamagansiz</p>}

        {history && history.length > 0 && (
          <ul className="history-list">
            {history.map((entry) => {
              const type = TYPE_META[entry.type] || TYPE_META.duel;
              const result = RESULT_META[entry.result] || RESULT_META.lose;
              return (
                <li key={entry.id} className="history-item">
                  <div className={`history-item-icon ${result.className}`}>
                    <type.Icon size={18} />
                  </div>
                  <div className="history-item-main">
                    <div className="history-item-top">
                      <strong>{type.label}</strong>
                      <span className={`history-result-badge ${result.className}`}>{result.label}</span>
                    </div>
                    {entry.detail && <p className="muted">{entry.detail}</p>}
                    <span className="muted history-item-date">{formatDate(entry.createdAt)}</span>
                  </div>
                  <div className="history-item-rewards">
                    <span className="history-reward">
                      <IconCoin size={14} /> +{entry.coins}
                    </span>
                    <span className="history-reward">
                      <IconGlobe size={14} /> +{entry.hp} HP
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </article>
    </Layout>
  );
}

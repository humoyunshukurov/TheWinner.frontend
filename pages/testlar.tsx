import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { IconClock } from '../components/icons';
import { getGuest } from '../lib/guest';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function TestlarPage() {
  const [tests, setTests] = useState(null);

  useEffect(() => {
    const { guestId } = getGuest();
    fetch(`${API_URL}/tests?guestId=${guestId}`, { cache: 'no-store' }).then((res) => res.json()).then(setTests).catch(() => {});
  }, []);

  return (
    <Layout title="Testlar">
      {tests ? (
        <div className="test-grid">
          {tests.map((test) => (
            <article className="card test-card" key={test.id}>
              <div className="test-card-top">
                <div>
                  <span className="tag">{test.subject}</span>
                  <h4>{test.title}</h4>
                </div>
              </div>

              <div className="test-meta">
                <span>
                  <IconClock /> {test.questionSeconds}s/savol
                </span>
              </div>

              <div className="test-card-footer">
                {test.status === 'completed' ? (
                  <span className="badge good">{test.correctCount} / {test.total} to'g'ri</span>
                ) : (
                  <span className="badge warn">Yechilmagan</span>
                )}
                <Link href={`/testlar/${test.id}`} className="pill-btn primary">
                  {test.status === 'completed' ? 'Qayta topshirish' : 'Boshlash'}
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">Yuklanmoqda...</p>
      )}
    </Layout>
  );
}

import { useEffect, useState } from 'react';
import { IconClock } from './icons';
import { getGuest } from '../lib/guest';
import { fetchUsage, formatStopwatch, formatUsageDuration } from '../lib/usage';

const REFRESH_MS = 30000;

// Bosh sahifadagi "Ishlatish vaqti" kartasi: chapda shu tashrif davomida
// (sahifa ochilgandan beri) soniyama-soniya yuguruvchi stopwatch, o'ngda
// serverdan kelgan haqiqiy bugungi/jami statistika. Stopwatch faqat
// vizual - har safar sahifa qayta ochilganda 00:00 dan boshlanadi;
// haqiqiy hisob (bugun/jami) esa serverda saqlanadi, shuning uchun bir
// nechta qurilma/tab ochiq bo'lsa ham noto'g'ri/tasodifiy son chiqmaydi.
export default function UsageClock() {
  const [sessionMs, setSessionMs] = useState(0);
  const [usage, setUsage] = useState<{ todayMs: number; totalMs: number } | null>(null);

  useEffect(() => {
    const start = Date.now();
    const tick = () => setSessionMs(Date.now() - start);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const { guestId } = getGuest();
    function load() {
      fetchUsage(guestId).then(setUsage);
    }
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <article className="card usage-card">
      <div className="alert-icon accent">
        <IconClock size={22} />
      </div>
      <div>
        <span className="usage-clock">{formatStopwatch(sessionMs)}</span>
        <div className="usage-stats-row">
          <span>
            Bugun: <strong>{usage ? formatUsageDuration(usage.todayMs) : '...'}</strong>
          </span>
          <span>
            Jami: <strong>{usage ? formatUsageDuration(usage.totalMs) : '...'}</strong>
          </span>
        </div>
      </div>
    </article>
  );
}

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconClock } from './icons';
import { getGuest } from '../lib/guest';
import { fetchUsage, formatUsageDuration, type UsageStats } from '../lib/usage';

const REFRESH_MS = 30000;

export default function UsageClock() {
  const [usage, setUsage] = useState<UsageStats | null>(null);

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
    <Link href="/vaqt" className="card alert-card usage-card-link">
      <div className="alert-icon accent">
        <IconClock size={22} />
      </div>
      <div>
        <strong>Bugun ishlatilgan vaqt</strong>
        <span className="muted-link">{usage ? formatUsageDuration(usage.todayMs) : '...'}</span>
      </div>
    </Link>
  );
}

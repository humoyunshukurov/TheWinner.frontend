import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { IconGrid, IconQuiz, IconPlay, IconTrophy, IconGear, IconArrowLeft, IconShield, IconUsers, IconClock } from './icons';
import { getGuest, GUEST_CHANGED_EVENT } from '../lib/guest';
import { loadProfilePhoto, PROFILE_PHOTO_CHANGED_EVENT } from '../lib/profile';
import { addUsageMs } from '../lib/usage';
import LottieCoin from './LottieCoin';
import LottieMenuToggle from './LottieMenuToggle';
import CrownBadge from './CrownBadge';
import ThemeToggle from './ThemeToggle';
import LogoutButton from './LogoutButton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const TICK_MS = 5000;
const IDLE_LIMIT_MS = 30000;
const SIDEBAR_COLLAPSED_KEY = 'nt_sidebar_collapsed';

const navItems = [
  { label: 'Bosh sahifa', href: '/', Icon: IconGrid },
  { label: 'Testlar', href: '/testlar', Icon: IconQuiz },
  { label: "O'yin", href: '/oyin', Icon: IconPlay },
  { label: 'Reyting', href: '/reyting', Icon: IconTrophy },
  { label: 'Guruhlar', href: '/guruhlar', Icon: IconUsers },
  { label: 'Tarix', href: '/tarix', Icon: IconClock },
  { label: 'Sozlamalar', href: '/sozlamalar', Icon: IconGear }
];

export default function Layout({
  title,
  eyebrow,
  backHref,
  children
}: {
  title?: string;
  eyebrow?: string;
  backHref?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [coins, setCoins] = useState(null);
  const [rank, setRank] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1');
  }, []);

  function toggleSidebar() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      return next;
    });
  }

  useEffect(() => {
    function loadStats() {
      const { guestId } = getGuest();
      fetch(`${API_URL}/coins?guestId=${guestId}`).then((res) => res.json()).then((data) => setCoins(data.coins)).catch(() => {});
      fetch(`${API_URL}/hp?guestId=${guestId}`).then((res) => res.json()).then((data) => setRank(data.rank)).catch(() => {});
      setPhoto(loadProfilePhoto(guestId));
    }

    loadStats();
    window.addEventListener(GUEST_CHANGED_EVENT, loadStats);
    window.addEventListener(PROFILE_PHOTO_CHANGED_EVENT, loadStats);
    return () => {
      window.removeEventListener(GUEST_CHANGED_EVENT, loadStats);
      window.removeEventListener(PROFILE_PHOTO_CHANGED_EVENT, loadStats);
    };
  }, [router.pathname]);

  useEffect(() => {
    let lastActivity = Date.now();
    const markActive = () => {
      lastActivity = Date.now();
    };
    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => window.addEventListener(event, markActive, { passive: true }));

    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastActivity < IDLE_LIMIT_MS) {
        addUsageMs(TICK_MS);
      }
    }, TICK_MS);

    return () => {
      events.forEach((event) => window.removeEventListener(event, markActive));
      clearInterval(interval);
    };
  }, []);

  function isActive(href) {
    return href !== '#' && (router.pathname === href || router.pathname.startsWith(`${href}/`));
  }

  return (
    <main className={`shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">N</div>
          <h1>Najot Ta'lim</h1>
        </div>

        <nav className="nav-links">
          {navItems.map(({ label, href, Icon }) => (
            <Link key={label} href={href} className={isActive(href) ? 'active' : ''}>
              <Icon />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="sidebar-toggle-btn"
              onClick={toggleSidebar}
              aria-label={collapsed ? "Panelni ochish" : "Panelni yopish"}
            >
              <LottieMenuToggle collapsed={collapsed} size={20} />
            </button>
            <div>
              {backHref && (
                <Link href={backHref} className="back-link">
                  <IconArrowLeft /> Orqaga
                </Link>
              )}
              {title && <h2>{title}</h2>}
            </div>
          </div>

          <div className="topbar-actions">
            <ThemeToggle />
            {rank && (
              <div className={`rank-badge-pill rank-${rank.id}`}>
                <IconShield size={14} />
                <span>{rank.label}</span>
              </div>
            )}
            {coins !== null && (
              <div className="coin-badge">
                <LottieCoin size={36} />
                {coins}
              </div>
            )}
            <LogoutButton compact />
            <div className="avatar-wrap">
              {rank?.id === 'diamond' && <CrownBadge className="avatar-crown" />}
              <div className="avatar">{photo ? <img src={photo} alt="" /> : 'AN'}</div>
            </div>
          </div>
        </header>

        {eyebrow && <p className="eyebrow">{eyebrow}</p>}

        {children}
      </section>

      <nav className="bottom-nav">
        {navItems.map(({ label, href, Icon }) => (
          <Link key={label} href={href} className={isActive(href) ? 'active' : ''}>
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}

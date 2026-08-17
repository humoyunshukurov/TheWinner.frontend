function Svg({ children, size = 20, fill = 'none', stroke = 'currentColor', className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

export function IconArrowLeft(props) {
  return (
    <Svg size={16} {...props}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </Svg>
  );
}

export function IconMenu(props) {
  return (
    <Svg {...props}>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
    </Svg>
  );
}

export function IconGrid(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </Svg>
  );
}

export function IconBook(props) {
  return (
    <Svg {...props}>
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5Z" />
      <path d="M20 19H6.5A2.5 2.5 0 0 0 4 21.5" />
    </Svg>
  );
}

export function IconUsers(props) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.8 20c.6-3.4 3-5.3 6.2-5.3s5.6 1.9 6.2 5.3" />
      <circle cx="17.5" cy="7.5" r="2.5" />
      <path d="M15.6 14.9c2.6.2 4.4 2 4.9 4.9" />
    </Svg>
  );
}

export function IconUser(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c1-4.3 4-6.6 7.5-6.6s6.5 2.3 7.5 6.6" />
    </Svg>
  );
}

export function IconCalendar(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9.5h18" />
      <path d="M8 2.5v4M16 2.5v4" />
      <path d="m8.5 14 2 2 4-4" />
    </Svg>
  );
}

export function IconBarChart(props) {
  return (
    <Svg {...props}>
      <path d="M4 20V10.5M12 20V4M20 20v-6.5" />
    </Svg>
  );
}

export function IconGear(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Svg>
  );
}

export function IconPlus(props) {
  return (
    <Svg size={16} {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function IconFile(props) {
  return (
    <Svg size={16} {...props}>
      <path d="M6 2.5h8l4 4V21a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z" />
      <path d="M14 2.5V7h4" />
    </Svg>
  );
}

export function IconBell(props) {
  return (
    <Svg size={16} {...props}>
      <path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13.5 6 9.5Z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </Svg>
  );
}

export function IconQuiz(props) {
  return (
    <Svg {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2.5" />
      <path d="M9 2.5h6a1 1 0 0 1 1 1V5H8V3.5a1 1 0 0 1 1-1Z" />
      <path d="m8.5 12.5 2 2 4-4.5" />
      <path d="M8.5 17h7" />
    </Svg>
  );
}

export function IconTrophy(props) {
  return (
    <Svg {...props}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0Z" />
      <path d="M7 5H4.5A2.5 2.5 0 0 0 5.6 9.8L7 10.5M17 5h2.5A2.5 2.5 0 0 1 18.4 9.8L17 10.5" />
      <path d="M12 14v3M9 21h6M9.5 21c0-2 .8-3 2.5-3s2.5 1 2.5 3" />
    </Svg>
  );
}

export function IconCoin(props) {
  return (
    <Svg size={16} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v9M9.3 9.3c0-1 1-1.8 2.7-1.8 1.8 0 2.8.9 2.8 1.9 0 2.6-5.5 1.2-5.5 3.7 0 1 1 1.9 2.7 1.9s2.8-.8 2.8-1.9" />
    </Svg>
  );
}

export function IconSparkle(props) {
  return (
    <Svg {...props}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="m6.5 6.5 2 2M15.5 15.5l2 2M17.5 6.5l-2 2M8.5 15.5l-2 2" />
      <circle cx="12" cy="12" r="2.3" />
    </Svg>
  );
}

export function IconPlay(props) {
  return (
    <Svg {...props}>
      <path d="M7 4.5v15l13-7.5Z" />
    </Svg>
  );
}

export function IconSwords(props) {
  return (
    <Svg {...props}>
      <path d="m5 4 8.5 8.5M5 4 4 6l8 8M15.5 8.5 20 4l1 2-8 8" />
      <path d="m4 20 5-5M20 20l-5-5" />
    </Svg>
  );
}

export function IconClock(props) {
  return (
    <Svg size={14} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  );
}

export function IconVolume(props) {
  return (
    <Svg {...props}>
      <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4Z" />
      <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" />
    </Svg>
  );
}

export function IconShield(props) {
  return (
    <Svg {...props}>
      <path d="M12 3 4.5 5.5v6c0 4.5 3.2 7.6 7.5 9 4.3-1.4 7.5-4.5 7.5-9v-6Z" />
      <path d="m9 12 2 2 4-4.5" />
    </Svg>
  );
}

export function IconLogout(props) {
  return (
    <Svg {...props}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M15 16.5 20 12l-5-4.5M20 12H9" />
    </Svg>
  );
}

export function IconLogin(props) {
  return (
    <Svg {...props}>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M9 16.5 4 12l5-4.5M4 12h11" />
    </Svg>
  );
}

export function IconSend(props) {
  return (
    <Svg {...props}>
      <path d="m3 11 18-8-8 18-2.5-7.5L3 11Z" />
    </Svg>
  );
}

export function IconLock(props) {
  return (
    <Svg size={16} {...props}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </Svg>
  );
}

export function IconEdit(props) {
  return (
    <Svg size={16} {...props}>
      <path d="M14.5 4.5 19 9l-9.5 9.5H5v-4.5Z" />
    </Svg>
  );
}

export function IconCamera(props) {
  return (
    <Svg size={16} {...props}>
      <path d="M4 8.5A2 2 0 0 1 6 6.5h1.5l1-2h7l1 2H18a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </Svg>
  );
}

export function IconBolt(props) {
  return (
    <Svg size={15} {...props} fill="currentColor" stroke="none">
      <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
    </Svg>
  );
}

export function IconTrendUp(props) {
  return (
    <Svg {...props}>
      <path d="M3 16.5 9.5 10l4 4L21 6.5" />
      <path d="M15 6.5h6v6" />
    </Svg>
  );
}

export function IconGlobe(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.6 2.6 4 5.8 4 9s-1.4 6.4-4 9c-2.6-2.6-4-5.8-4-9s1.4-6.4 4-9Z" />
    </Svg>
  );
}

export function IconSun(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7" />
    </Svg>
  );
}

export function IconMoon(props) {
  return (
    <Svg {...props} fill="currentColor" stroke="none">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </Svg>
  );
}

export function IconEye(props) {
  return (
    <Svg size={16} {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </Svg>
  );
}

export function IconEyeOff(props) {
  return (
    <Svg size={16} {...props}>
      <path d="M3.5 3.5l17 17" />
      <path d="M10.6 5.7A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a15.3 15.3 0 0 1-3.2 4.1M6.7 6.9C4.2 8.6 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.4 0 2.7-.3 3.8-.9" />
      <path d="M9.9 10.1a2.6 2.6 0 0 0 3.6 3.7" />
    </Svg>
  );
}

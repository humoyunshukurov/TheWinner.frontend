import { useEffect, useRef } from 'react';

// Frame 0 = hamburger (☰), frame 79 = back/close arrow (←) - a
// "Hamburger to Back Button" morph. When the sidebar is open, the button's
// job is "collapse it", so it rests on the arrow end; when the sidebar is
// hidden, its job is "open it", so it rests on the hamburger end. Only the
// morph itself plays on toggle - it doesn't loop and isn't autoplayed.
const LAST_FRAME = 79;

export default function LottieMenuToggle({ collapsed, size = 20 }: { collapsed: boolean; size?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<any>(null);
  const readyRef = useRef(false);
  const prevCollapsed = useRef(collapsed);

  useEffect(() => {
    let cancelled = false;

    import('lottie-web').then(({ default: lottie }) => {
      if (cancelled || !containerRef.current) return;
      const anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: '/animations/menu-toggle.json'
      });
      animRef.current = anim;
      anim.addEventListener('DOMLoaded', () => {
        readyRef.current = true;
        anim.goToAndStop(collapsed ? 0 : LAST_FRAME, true);
      });
    });

    return () => {
      cancelled = true;
      animRef.current?.destroy();
    };
    // Only the initial state matters here - later changes are handled by
    // the effect below so the button plays the morph instead of snapping.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!readyRef.current || !animRef.current || prevCollapsed.current === collapsed) return;
    prevCollapsed.current = collapsed;
    animRef.current.setDirection(collapsed ? -1 : 1);
    animRef.current.play();
  }, [collapsed]);

  return <div ref={containerRef} style={{ width: size, height: size }} />;
}

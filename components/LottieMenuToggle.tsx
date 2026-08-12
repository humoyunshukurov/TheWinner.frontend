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

  // `collapsed` starts false on first render and only flips to its real
  // (localStorage-backed) value a moment later, in Layout's own effect.
  // Lottie loads asynchronously over the network, so its DOMLoaded callback
  // below can easily fire AFTER that flip - but a `[]`-deps effect's
  // closure only ever sees the value from the render it was created in.
  // Mirroring `collapsed` into a ref keeps the callback reading the latest
  // value instead of that stale snapshot.
  const collapsedRef = useRef(collapsed);
  useEffect(() => {
    collapsedRef.current = collapsed;
  }, [collapsed]);

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
        anim.goToAndStop(collapsedRef.current ? 0 : LAST_FRAME, true);
        prevCollapsed.current = collapsedRef.current;
      });
    });

    return () => {
      cancelled = true;
      animRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!readyRef.current || !animRef.current || prevCollapsed.current === collapsed) return;
    prevCollapsed.current = collapsed;
    animRef.current.setDirection(collapsed ? -1 : 1);
    animRef.current.play();
  }, [collapsed]);

  return <div ref={containerRef} style={{ width: size, height: size }} />;
}

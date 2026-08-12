import { useEffect, useRef } from 'react';

// This "Hamburger to Back Button" asset is authored as a single 80-frame
// LOOP, not a one-way morph: frame 0 = hamburger (☰), it morphs into a
// clean back-arrow (←) around frame 40 (the loop's midpoint), then morphs
// BACK to hamburger by frame 79 so it can repeat seamlessly. Verified by
// screenshotting every frame directly against lottie-web - frame 79 itself
// is out of the valid [0, 79) range and renders nothing, and frames near
// it are hamburger again, not the arrow. For a two-state toggle we only
// ever need the first half of the loop: play 0->ARROW_FRAME to open, and
// ARROW_FRAME->0 to close.
const HAMBURGER_FRAME = 0;
const ARROW_FRAME = 40;

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
        anim.goToAndStop(collapsedRef.current ? HAMBURGER_FRAME : ARROW_FRAME, true);
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
    animRef.current.playSegments(collapsed ? [ARROW_FRAME, HAMBURGER_FRAME] : [HAMBURGER_FRAME, ARROW_FRAME], true);
  }, [collapsed]);

  return <div ref={containerRef} style={{ width: size, height: size }} />;
}

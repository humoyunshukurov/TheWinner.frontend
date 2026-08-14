import { useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import DuelGame, { type DuelGameHandle } from '../../components/DuelGame';

// A real opponent only exists once matched - 'searching' is just this
// player alone in the queue, so leaving it isn't a forfeit against anyone.
const PHASES_WITH_A_LIVE_OPPONENT = ['matched', 'playing', 'waiting_opponent'];

export default function DuelPage() {
  const router = useRouter();
  const duelRef = useRef<DuelGameHandle>(null);
  const [phase, setPhase] = useState('idle');

  async function handleBackAttempt() {
    if (!PHASES_WITH_A_LIVE_OPPONENT.includes(phase)) {
      router.push('/oyin');
      return;
    }

    const confirmed = window.confirm(
      "Testni tugatishni xohlaysizmi? Ha desangiz, raqibingiz g'olib deb topiladi."
    );
    if (!confirmed) return;

    await duelRef.current?.forfeit();
    router.push('/oyin');
  }

  return (
    <Layout backHref="/oyin" onBackAttempt={handleBackAttempt}>
      <DuelGame ref={duelRef} onPhaseChange={setPhase} />
    </Layout>
  );
}

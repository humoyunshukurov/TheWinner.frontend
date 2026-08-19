import { useRef, useState } from 'react';
import Layout from '../../components/Layout';
import DuelGame, { type DuelGameHandle } from '../../components/DuelGame';

export default function DuelPage() {
  const duelRef = useRef<DuelGameHandle>(null);
  const [, setPhase] = useState('idle');

  return (
    <Layout>
      <DuelGame ref={duelRef} onPhaseChange={setPhase} />
    </Layout>
  );
}

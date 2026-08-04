import { useState } from 'react';
import Layout from '../components/Layout';
import DuelGame from '../components/DuelGame';
import TournamentBanner from '../components/TournamentBanner';
import KodBanner from '../components/KodBanner';

export default function OyinHubPage() {
  const [duelActive, setDuelActive] = useState(false);

  return (
    <Layout eyebrow="Qaysi rejimda o'ynaymiz?" title="O'yinlar">
      <div className={duelActive ? 'duel-stage' : 'mode-grid'}>
        <div className={duelActive ? 'duel-stage-inner' : 'mode-card mode-card-battle'}>
          <DuelGame compact={!duelActive} onPhaseChange={(phase) => setDuelActive(phase !== 'idle')} />
        </div>

        {!duelActive && (
          <>
            <div className="mode-card mode-card-battle">
              <KodBanner compact href="/oyin/kod" />
            </div>

            <div className="mode-card mode-card-battle">
              <TournamentBanner compact href="/oyin/turnir" />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

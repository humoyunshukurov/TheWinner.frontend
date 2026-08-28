import { useState } from 'react';
import Layout from '../components/Layout';
import DuelGame from '../components/DuelGame';
import TournamentBanner from '../components/TournamentBanner';
import KodBanner from '../components/KodBanner';
import MarafonBanner from '../components/MarafonBanner';
import StarBadge from '../components/StarBadge';
import { useMyGroup } from '../lib/useMyGroup';

export default function OyinHubPage() {
  const [duelActive, setDuelActive] = useState(false);
  // Kod bilan o'yin doesn't even show up for a groupless guest, not just
  // locked - defaults to "don't show" while still loading too, rather
  // than flashing it briefly before the real check comes back.
  const { hasGroup, loaded } = useMyGroup();

  return (
    <Layout title="O'yinlar">
      <div className={duelActive ? 'duel-stage' : 'mode-grid'}>
        <div className={duelActive ? 'duel-stage-inner' : 'mode-card mode-card-battle'}>
          {!duelActive && <StarBadge size={30} className="mode-card-star" />}
          <DuelGame
            compact={!duelActive}
            resumeFinished={false}
            onPhaseChange={(phase) => setDuelActive(phase !== 'idle')}
          />
        </div>

        {!duelActive && (
          <>
            {loaded && hasGroup && (
              <div className="mode-card mode-card-battle">
                <StarBadge size={30} className="mode-card-star" />
                <KodBanner compact href="/oyin/kod" />
              </div>
            )}

            <div className="mode-card mode-card-battle">
              <StarBadge size={30} className="mode-card-star" />
              <TournamentBanner compact href="/oyin/turnir" />
            </div>

            <div className="mode-card mode-card-battle">
              <StarBadge size={30} className="mode-card-star" />
              <MarafonBanner compact href="/oyin/marafon" />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

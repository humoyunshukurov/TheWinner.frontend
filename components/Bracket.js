import { IconTrophy } from './icons';

function BracketMatch({ entry }) {
  if (entry.isBye) {
    const [player] = entry.players;
    return (
      <div className="bracket-match">
        <div className="bracket-player winner">{player.name}</div>
        <div className="bracket-player bye">BYE (avtomatik o'tdi)</div>
      </div>
    );
  }

  const [a, b] = entry.players;
  return (
    <div className="bracket-match">
      {[a, b].map((player) => {
        const isWinner = player.guestId === entry.winnerGuestId;
        return (
          <div key={player.guestId} className={`bracket-player ${isWinner ? 'winner' : 'loser'}`}>
            {!isWinner && <span className="bracket-x">✕</span>} {player.name}
          </div>
        );
      })}
    </div>
  );
}

export default function Bracket({ rounds, champion }) {
  if (!rounds || rounds.length === 0) return null;

  return (
    <div className="bracket">
      {rounds.map((round, index) => (
        <div className="bracket-round" key={index} style={{ gap: `${18 * Math.pow(1.7, index)}px` }}>
          {round.map((entry) => (
            <BracketMatch entry={entry} key={`${entry.round}-${entry.players[0].guestId}`} />
          ))}
        </div>
      ))}

      <div className="bracket-round bracket-final">
        <div className={`bracket-champion ${champion ? 'ready' : ''}`}>
          <IconTrophy size={22} />
          <span>{champion ? champion.name : 'Kutilmoqda...'}</span>
        </div>
      </div>
    </div>
  );
}

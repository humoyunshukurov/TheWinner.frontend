import { useEffect, useRef, useState } from 'react';
import BattleBanner from './BattleBanner';
import { IconSwords } from './icons';
import { getGuest } from '../lib/guest';
import { useRequireAccess } from '../lib/useRequireAccess';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function DuelGame({ compact, onPhaseChange }) {
  const [phase, setPhase] = useState('idle');
  const [duel, setDuel] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [reward, setReward] = useState(null);

  const pollRef = useRef(null);
  const startTimeRef = useRef(null);
  const guestRef = useRef({ guestId: '', name: '' });
  const { requireAccess } = useRequireAccess();

  useEffect(() => {
    guestRef.current = getGuest();
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  function enterMatch(data) {
    setDuel(data);
    setAnswers(new Array(data.questions.length).fill(null));
    startTimeRef.current = Date.now();
    setPhase('playing');
  }

  function startSearch() {
    requireAccess(doStartSearch);
  }

  function doStartSearch() {
    setPhase('searching');
    const { guestId, name } = guestRef.current;

    fetch(`${API_URL}/duel/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId, name })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'matched') {
          enterMatch(data);
        } else {
          pollRef.current = setInterval(pollMatch, 1500);
        }
      });
  }

  function pollMatch() {
    const { guestId } = guestRef.current;
    fetch(`${API_URL}/duel/poll?guestId=${guestId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'matched') {
          clearInterval(pollRef.current);
          enterMatch(data);
        }
      });
  }

  function selectAnswer(qIndex, oIndex) {
    setAnswers((prev) => prev.map((value, i) => (i === qIndex ? oIndex : value)));
  }

  function handleSubmit() {
    const timeMs = Date.now() - startTimeRef.current;
    const { guestId } = guestRef.current;

    fetch(`${API_URL}/duel/${duel.duelId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId, answers, timeMs })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'finished') {
          setResult(data.result);
          setReward(data.reward);
          setPhase('finished');
        } else {
          setPhase('waiting_opponent');
          pollRef.current = setInterval(pollResult, 1500);
        }
      });
  }

  function pollResult() {
    const { guestId } = guestRef.current;
    fetch(`${API_URL}/duel/${duel.duelId}/result?guestId=${guestId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'finished') {
          clearInterval(pollRef.current);
          setResult(data.result);
          setReward(data.reward);
          setPhase('finished');
        }
      });
  }

  function cancelSearch() {
    clearInterval(pollRef.current);
    const { guestId } = guestRef.current;
    fetch(`${API_URL}/duel/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId })
    });
    setPhase('idle');
  }

  function playAgain() {
    setPhase('idle');
    setDuel(null);
    setResult(null);
    setReward(null);
    setAnswers([]);
  }

  const allAnswered = answers.length > 0 && answers.every((a) => a !== null);
  const me = result?.players.find((p) => p.guestId === guestRef.current.guestId);
  const opponent = result?.players.find((p) => p.guestId !== guestRef.current.guestId);
  const iWon = result && result.winnerGuestId === guestRef.current.guestId;
  const isDraw = result && !result.winnerGuestId;

  return (
    <>
      {phase === 'idle' && (
        compact ? (
          <BattleBanner onPlay={startSearch} compact />
        ) : (
          <div className="game-hero">
            <div className="game-card battle-card">
              <BattleBanner onPlay={startSearch} />
            </div>
          </div>
        )
      )}

      {phase === 'searching' && (
        <div className="game-hero">
          <div className="game-card">
            <div className="duel-spinner" />
            <h3>Raqib qidirilmoqda...</h3>
            <p className="muted">Boshqa o'yinchi "O'ynash" tugmasini bosishini kutyapmiz</p>
            <button className="pill-btn" onClick={cancelSearch}>
              Bekor qilish
            </button>
          </div>
        </div>
      )}

      {phase === 'playing' && duel && (
        <article className="card">
          <div className="duel-vs-banner">
            <span>Siz</span>
            <IconSwords size={16} />
            <span>{duel.opponent.name}</span>
          </div>

          {duel.questions.map((question, qIndex) => (
            <div className="question-block" key={question.text}>
              <p>
                {qIndex + 1}. {question.text}
              </p>
              <div className="options">
                {question.options.map((option, oIndex) => (
                  <label key={option} className={`option-label ${answers[qIndex] === oIndex ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name={`duel-q-${qIndex}`}
                      checked={answers[qIndex] === oIndex}
                      onChange={() => selectAnswer(qIndex, oIndex)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button className="pill-btn primary" disabled={!allAnswered} onClick={handleSubmit}>
            Yakunlash
          </button>
        </article>
      )}

      {phase === 'waiting_opponent' && (
        <div className="game-hero">
          <div className="game-card">
            <div className="duel-spinner" />
            <h3>Raqibingiz hali yakunlamadi</h3>
            <p className="muted">Natija tayyor bo'lishi bilanoq ko'rsatamiz</p>
          </div>
        </div>
      )}

      {phase === 'finished' && result && (
        <article className="card">
          <p className="muted">{iWon ? 'Siz yutdingiz! 🎉' : isDraw ? 'Durrang!' : 'Siz yutqazdingiz'}</p>

          <div className="duel-result-grid">
            <div className={`duel-result-side ${iWon ? 'winner' : ''}`}>
              <strong>Siz</strong>
              <div className="result-score">
                {me?.correctCount}/{me?.total}
              </div>
              <span className="muted">{((me?.timeMs || 0) / 1000).toFixed(1)}s</span>
            </div>
            <div className="duel-result-vs">VS</div>
            <div className={`duel-result-side ${!iWon && !isDraw ? 'winner' : ''}`}>
              <strong>{opponent?.name}</strong>
              <div className="result-score">
                {opponent?.correctCount}/{opponent?.total}
              </div>
              <span className="muted">{((opponent?.timeMs || 0) / 1000).toFixed(1)}s</span>
            </div>
          </div>

          {reward && (
            <div className="coins-earned-banner" style={{ marginTop: 14 }}>
              +{reward.coins} tanga &middot; +{reward.hp} HP
            </div>
          )}

          <div className="action-row" style={{ marginTop: 18 }}>
            <button className="pill-btn primary" onClick={playAgain}>
              Qayta o'ynash
            </button>
          </div>
        </article>
      )}
    </>
  );
}

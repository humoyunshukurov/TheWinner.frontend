import { useEffect, useRef, useState } from 'react';
import Layout from '../../components/Layout';
import Bracket from '../../components/Bracket';
import TournamentBanner from '../../components/TournamentBanner';
import { IconTrophy, IconUsers, IconClock } from '../../components/icons';
import { getGuest } from '../../lib/guest';
import { useRequireAccess } from '../../lib/useRequireAccess';
import { burstSideConfetti } from '../../lib/confetti';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const QUESTION_SECONDS = 15;

function rankBadgeClass(place) {
  if (place === 1) return 'rank-badge gold';
  if (place === 2) return 'rank-badge silver';
  if (place === 3) return 'rank-badge bronze';
  return 'rank-badge';
}

export default function TurnirPage() {
  const guestRef = useRef({ guestId: '', name: '' });
  const startTimeRef = useRef(null);
  const loadedMatchIdRef = useRef(null);

  const [state, setState] = useState(null);
  const [bracket, setBracket] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
  const [submittedMatchId, setSubmittedMatchId] = useState(null);
  const { requireAccess } = useRequireAccess();

  useEffect(() => {
    guestRef.current = getGuest();
    poll();
    const interval = setInterval(poll, 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (state?.status !== 'match') return;
    setTimeLeft(QUESTION_SECONDS);
  }, [currentIndex, state?.status]);

  useEffect(() => {
    if (state?.status !== 'match' || submittedMatchId === state?.matchId) return;

    if (timeLeft <= 0) {
      goToNext();
      return;
    }

    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, state?.status, submittedMatchId]);

  useEffect(() => {
    if (state?.status !== 'finished') return;
    if (state.standings?.[0]?.guestId !== guestRef.current.guestId) return;
    return burstSideConfetti(3000);
    // state?.standings is deliberately left out - polling keeps refreshing
    // it with a brand-new array every 1.5s even after the tournament ends
    // (same values, new reference), which was retriggering a fresh burst
    // on every poll and never letting the confetti actually stop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.status]);

  function poll() {
    const { guestId } = guestRef.current;
    fetch(`${API_URL}/tournament/state?guestId=${guestId}`)
      .then((res) => res.json())
      .then((data) => {
        setState(data);
        if (data.status === 'match' && data.matchId !== loadedMatchIdRef.current) {
          loadedMatchIdRef.current = data.matchId;
          setAnswers(new Array(data.questions.length).fill(null));
          setCurrentIndex(0);
          setTimeLeft(QUESTION_SECONDS);
          startTimeRef.current = Date.now();
          setSubmittedMatchId(null);
        }
      })
      .catch(() => {});

    fetch(`${API_URL}/tournament/bracket`)
      .then((res) => res.json())
      .then(setBracket)
      .catch(() => {});
  }

  function join() {
    requireAccess(doJoin);
  }

  function doJoin() {
    const { guestId, name } = guestRef.current;
    fetch(`${API_URL}/tournament/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId, name })
    }).then(poll);
  }

  function start() {
    fetch(`${API_URL}/tournament/start`, { method: 'POST' }).then(poll);
  }

  function selectAnswer(qIndex, oIndex) {
    setAnswers((prev) => prev.map((value, i) => (i === qIndex ? oIndex : value)));
  }

  function goToNext() {
    if (currentIndex < state.questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      submitMatch();
    }
  }

  function submitMatch() {
    const timeMs = Date.now() - startTimeRef.current;
    const { guestId } = guestRef.current;
    setSubmittedMatchId(state.matchId);
    fetch(`${API_URL}/tournament/match/${state.matchId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId, answers, timeMs })
    }).then(poll);
  }

  function playAgain() {
    fetch(`${API_URL}/tournament/reset`, { method: 'POST' }).then(() => {
      loadedMatchIdRef.current = null;
      setAnswers([]);
      setSubmittedMatchId(null);
      setBracket(null);
      poll();
    });
  }

  if (!state) {
    return (
      <Layout backHref="/oyin">
        <p className="muted">Yuklanmoqda...</p>
      </Layout>
    );
  }

  const question = state.status === 'match' ? state.questions?.[currentIndex] : null;
  const answered = answers[currentIndex] !== null && answers[currentIndex] !== undefined;
  const isLast = state.status === 'match' && currentIndex === state.questions.length - 1;
  const { guestId } = guestRef.current;

  return (
    <Layout backHref="/oyin">
      {state.status === 'lobby' && (
        <>
          <TournamentBanner />

          <article className="card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <h3>Kutish zali</h3>
              <span className="select-chip">{state.participants.length} kishi</span>
            </div>

            <ul className="facts-list" style={{ marginBottom: 18 }}>
              {state.participants.map((p) => (
                <li key={p.guestId}>
                  <IconUsers size={16} /> {p.name}
                  {p.guestId === guestId ? ' (siz)' : ''}
                </li>
              ))}
              {state.participants.length === 0 && <p className="muted">Hali hech kim qo'shilmadi</p>}
            </ul>

            {!state.joined ? (
              <button className="pill-btn primary" onClick={join}>
                Turnirga qo'shilish
              </button>
            ) : (
              <div className="action-row" style={{ alignItems: 'center' }}>
                <button className="pill-btn primary" disabled={!state.canStart} onClick={start}>
                  Boshlash
                </button>
                {!state.canStart && <p className="muted">Kamida 2 kishi kerak</p>}
              </div>
            )}
          </article>
        </>
      )}

      {state.status !== 'lobby' && bracket?.rounds?.length > 0 && (
        <article className="card">
          <div className="card-header">
            <h3>
              <IconTrophy size={18} /> Yakuniy pog'ona
            </h3>
            <span className="select-chip">1-o'rin uchun kurash</span>
          </div>
          <Bracket rounds={bracket.rounds} champion={bracket.champion} />
        </article>
      )}

      {state.status === 'match' && question && (
        <article className="card quiz-card">
          <div className="duel-vs-banner">
            <span>
              {state.round}-tur / {state.totalRounds}
            </span>
            <IconTrophy size={16} />
            <span>Raqib: {state.opponent.name}</span>
          </div>

          <div className="test-progress-header">
            <span className="test-progress-label">
              Savol {currentIndex + 1} / {state.questions.length}
            </span>
            <span className={`test-timer-badge ${timeLeft <= 3 ? 'low' : ''}`}>
              <IconClock /> {timeLeft}s
            </span>
          </div>
          <div className="test-progress-bar">
            <div
              className="test-progress-fill"
              style={{ width: `${((currentIndex + 1) / state.questions.length) * 100}%` }}
            />
          </div>

          <div className="question-block">
            <p>
              {currentIndex + 1}. {question.text}
            </p>
            <div className="options">
              {question.options.map((option, oIndex) => (
                <label key={option} className={`option-label ${answers[currentIndex] === oIndex ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name={`turnir-q-${currentIndex}`}
                    checked={answers[currentIndex] === oIndex}
                    onChange={() => selectAnswer(currentIndex, oIndex)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          <button
            className="pill-btn primary quiz-check-btn"
            disabled={!answered || submittedMatchId === state.matchId}
            onClick={goToNext}
          >
            {submittedMatchId === state.matchId ? 'Yuborildi...' : isLast ? 'Yakunlash' : 'Keyingi savol'}
          </button>
        </article>
      )}

      {(state.status === 'waiting_opponent' || state.status === 'waiting_round') && (
        <div className="game-hero">
          <div className="game-card">
            <div className="duel-spinner" />
            <h3>{state.status === 'waiting_opponent' ? 'Raqibingiz javob bermoqda...' : 'Keyingi tur kutilmoqda...'}</h3>
            <p className="muted">
              {state.round}-tur / {state.totalRounds}
            </p>
          </div>
        </div>
      )}

      {state.status === 'finished' && (
        <article className="card">
          <div className="card-header">
            <h3>
              <IconTrophy size={18} /> Yakuniy natijalar
            </h3>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>O'rin</th>
                  <th>Ishtirokchi</th>
                  <th>G'alabalar</th>
                </tr>
              </thead>
              <tbody>
                {state.standings.map((p) => (
                  <tr key={p.guestId} className={p.guestId === guestId ? 'me-row' : ''}>
                    <td>
                      <span className={rankBadgeClass(p.place)}>{p.place}</span>
                    </td>
                    <td>
                      {p.name}
                      {p.guestId === guestId ? ' (siz)' : ''}
                    </td>
                    <td>{p.wins}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {state.standings[0]?.guestId === guestId && (
            <div className="coins-earned-banner" style={{ marginTop: 14 }}>
              +10 bonus tanga &middot; +60 HP g'olib sifatida!
            </div>
          )}

          <div className="action-row" style={{ marginTop: 18 }}>
            <button className="pill-btn primary" onClick={playAgain}>
              Yangi turnir boshlash
            </button>
          </div>
        </article>
      )}
    </Layout>
  );
}

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Layout from '../../components/Layout';
import { IconPlay, IconTrophy, IconClock } from '../../components/icons';
import { getGuest } from '../../lib/guest';
import { useRequireAccess } from '../../lib/useRequireAccess';
import { burstSideConfetti } from '../../lib/confetti';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const QUESTION_SECONDS = 20;

export default function KodOyinPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [state, setState] = useState<any>(null);
  const [answered, setAnswered] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
  const [lastResult, setLastResult] = useState<{ correct: boolean; points: number } | null>(null);

  const guestRef = useRef({ guestId: '', name: '' });
  const pollRef = useRef<any>(null);
  const { requireAccess } = useRequireAccess();

  useEffect(() => {
    guestRef.current = getGuest();
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    if (!sessionCode) return;
    poll();
    pollRef.current = setInterval(poll, 1500);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionCode]);

  useEffect(() => {
    if (state?.status !== 'question') return;
    setAnswered(false);
    setSelectedIndex(null);
    setLastResult(null);
    setTimeLeft(QUESTION_SECONDS);
  }, [state?.index, state?.status]);

  useEffect(() => {
    if (state?.status !== 'question' || answered) return;
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, state?.status, answered]);

  useEffect(() => {
    if (state?.status !== 'finished') return;
    const { guestId } = guestRef.current;
    const iWon = state.leaderboard?.[0]?.guestId === guestId && state.leaderboard[0].score > 0;
    if (iWon) return burstSideConfetti(2000);
  }, [state?.status]);

  function poll() {
    const { guestId } = guestRef.current;
    fetch(`${API_URL}/kod/${sessionCode}/state?guestId=${guestId}`)
      .then((res) => res.json())
      .then(setState)
      .catch(() => {});
  }

  function submitJoin(event?: FormEvent) {
    if (event) event.preventDefault();
    requireAccess(doJoin);
  }

  function doJoin() {
    const trimmed = code.trim();
    if (!trimmed) return;

    setJoining(true);
    setError(null);
    const { guestId, name } = guestRef.current;

    fetch(`${API_URL}/kod/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: trimmed, guestId, name })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Xatolik yuz berdi');
        return data;
      })
      .then((data) => {
        setJoining(false);
        setSessionCode(data.code);
      })
      .catch((err) => {
        setJoining(false);
        setError(err.message);
      });
  }

  function selectAnswer(optionIndex: number) {
    if (answered) return;
    setAnswered(true);
    setSelectedIndex(optionIndex);
    const { guestId } = guestRef.current;

    fetch(`${API_URL}/kod/${sessionCode}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId, answerIndex: optionIndex })
    })
      .then((res) => res.json())
      .then((data) => {
        setLastResult({ correct: data.correct, points: data.points });
        poll();
      });
  }

  function leaveSession() {
    clearInterval(pollRef.current);
    setSessionCode(null);
    setState(null);
    setCode('');
  }

  if (!sessionCode) {
    return (
      <Layout eyebrow="Guruh bilan birga o'ynang" title="Kod bilan qo'shilish" backHref="/oyin">
        <div className="game-hero">
          <div className="game-card">
            <button className="game-icon-badge" onClick={() => submitJoin()} aria-label="Qo'shilish">
              <IconPlay size={26} />
            </button>

            <h3>O'yinni boshlash</h3>
            <p className="muted">Guruh bilan birga real vaqtda bilim sinovidan o'ting</p>

            <form className="game-code-form" onSubmit={submitJoin}>
              <input
                type="text"
                className="game-code-input"
                placeholder="Kodni kiriting"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                maxLength={6}
              />
            </form>

            {joining && <p className="game-message">Qo'shilinmoqda...</p>}
            {error && <p className="game-message">{error}</p>}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout eyebrow="Guruh bilan birga o'ynang" title="Kod bilan qo'shilish" backHref="/oyin">
      {state?.status === 'lobby' && (
        <div className="game-hero">
          <div className="game-card">
            <div className="duel-spinner" />
            <h3>Kutish zali</h3>
            <p className="muted">Boshlanishini kuting, xo'jayin (admin) o'yinni boshlaydi</p>
            <button className="pill-btn" onClick={leaveSession}>
              Chiqish
            </button>
          </div>
        </div>
      )}

      {state?.status === 'question' && (
        <article className="card quiz-card">
          <div className="test-progress-header">
            <span className="test-progress-label">
              Savol {state.index + 1} / {state.total}
            </span>
            <span className={`test-timer-badge ${timeLeft <= 3 ? 'low' : ''}`}>
              <IconClock /> {timeLeft}s
            </span>
          </div>
          <div className="test-progress-bar">
            <div className="test-progress-fill" style={{ width: `${((state.index + 1) / state.total) * 100}%` }} />
          </div>

          <div className="question-block">
            <p>{state.question?.text}</p>
            <div className="options">
              {state.question?.options.map((option: string, oIndex: number) => (
                <label
                  key={option}
                  className={`option-label ${selectedIndex === oIndex ? 'selected' : ''}`}
                  onClick={() => selectAnswer(oIndex)}
                >
                  <input
                    type="radio"
                    name={`kod-q-${state.index}`}
                    checked={selectedIndex === oIndex}
                    readOnly
                    disabled={answered}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          {answered && (
            <p className={`game-message ${lastResult ? (lastResult.correct ? 'good' : 'bad') : ''}`}>
              {lastResult
                ? lastResult.correct
                  ? `To'g'ri! +${lastResult.points} ball`
                  : "Noto'g'ri javob, 0 ball"
                : 'Javobingiz qabul qilinmoqda...'}
            </p>
          )}
        </article>
      )}

      {state?.status === 'waiting_next' && (
        <div className="game-hero">
          <div className="game-card">
            <div className="duel-spinner" />
            <h3>Keyingi savol kutilmoqda</h3>
            {lastResult && (
              <p className={`game-message ${lastResult.correct ? 'good' : 'bad'}`}>
                {lastResult.correct ? `To'g'ri! +${lastResult.points} ball` : "Noto'g'ri javob, 0 ball"}
              </p>
            )}
            <p className="muted">Umumiy balingiz: {state.score}</p>
          </div>
        </div>
      )}

      {state?.status === 'finished' && (
        <article className="card">
          <div className="card-header">
            <h3>
              <IconTrophy size={18} /> Yakuniy natijalar
            </h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>O'rin</th>
                <th>Ism</th>
                <th>Ball</th>
              </tr>
            </thead>
            <tbody>
              {state.leaderboard?.map((p: any) => (
                <tr key={p.guestId} className={p.guestId === guestRef.current.guestId ? 'me-row' : ''}>
                  <td>{p.place}</td>
                  <td>{p.name}</td>
                  <td>{p.score}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="action-row" style={{ marginTop: 18 }}>
            <button className="pill-btn primary" onClick={leaveSession}>
              Chiqish
            </button>
          </div>
        </article>
      )}
    </Layout>
  );
}

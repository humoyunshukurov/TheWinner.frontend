import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import QuestionPrompt from '../../components/QuestionPrompt';
import { IconPlay, IconTrophy, IconClock } from '../../components/icons';
import { getGuest } from '../../lib/guest';
import { useRequireAccess } from '../../lib/useRequireAccess';
import { useMyGroup } from '../../lib/useMyGroup';
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
  // Session can genuinely disappear server-side (expired after an hour of
  // inactivity, or - previously - a backend restart wiping it entirely).
  // Without this, a gone session just left state.status undefined and the
  // whole page silently rendered nothing forever, which read as "frozen".
  const [sessionError, setSessionError] = useState<string | null>(null);

  const guestRef = useRef({ guestId: '', name: '' });
  const pollRef = useRef<any>(null);
  const { requireAccess } = useRequireAccess();
  const router = useRouter();
  // Direct-link/back-forward guard - the hub already doesn't show this
  // tile at all for a groupless guest, so landing here straight by URL
  // shouldn't reveal it either; bounce back to the hub instead of
  // rendering anything about Kod for them.
  const { hasGroup, loaded: groupLoaded } = useMyGroup();

  useEffect(() => {
    guestRef.current = getGuest();
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    if (groupLoaded && !hasGroup) {
      router.replace('/oyin');
    }
  }, [groupLoaded, hasGroup, router]);

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
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          clearInterval(pollRef.current);
          setSessionError(data.message || "Sessiya topilmadi yoki tugagan");
          return;
        }
        setState(data);
      })
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
    setSessionError(null);
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

  function chooseOption(optionIndex: number) {
    // Just selects locally - a mistaken tap no longer locks in the wrong
    // answer, since nothing is sent to the server until "Topshirish".
    if (answered || timeLeft <= 0) return;
    setSelectedIndex(optionIndex);
  }

  function submitAnswer() {
    if (answered || selectedIndex === null) return;
    setAnswered(true);
    const { guestId } = guestRef.current;

    fetch(`${API_URL}/kod/${sessionCode}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId, answerIndex: selectedIndex })
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
    setSessionError(null);
  }

  // Still checking group membership, or confirmed groupless and about to
  // be bounced back to the hub (see the effect above) - either way,
  // nothing about Kod should flash on screen while that's unresolved.
  if (!sessionCode && (!groupLoaded || !hasGroup)) {
    return (
      <Layout>
        <p className="muted">Yuklanmoqda...</p>
      </Layout>
    );
  }

  if (!sessionCode) {
    return (
      <Layout title="Kod bilan qo'shilish">
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
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                className="game-code-input"
                placeholder="000000"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
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
    <Layout title="Kod bilan qo'shilish">
      {sessionError && (
        <div className="game-hero">
          <div className="game-card">
            <h3>Sessiya uzildi</h3>
            <p className="muted">{sessionError} - o&apos;qituvchidan yangi kod so&apos;rang.</p>
            <button className="pill-btn primary" onClick={leaveSession}>
              Chiqish
            </button>
          </div>
        </div>
      )}

      {!sessionError && state?.status === 'lobby' && (
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

      {!sessionError && state?.status === 'question' && (
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
            <QuestionPrompt text={state.question?.text} image={state.question?.image} />
            <div className="options">
              {state.question?.options.map((option: string, oIndex: number) => (
                <label
                  key={option}
                  className={`option-label ${selectedIndex === oIndex ? 'selected' : ''}`}
                  onClick={() => chooseOption(oIndex)}
                >
                  <input
                    type="radio"
                    name={`kod-q-${state.index}`}
                    checked={selectedIndex === oIndex}
                    readOnly
                    disabled={answered || timeLeft <= 0}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          {!answered && selectedIndex !== null && (
            <div className="action-row" style={{ marginTop: 14 }}>
              <button className="pill-btn primary quiz-check-btn" onClick={submitAnswer}>
                Topshirish
              </button>
            </div>
          )}

          {!answered && selectedIndex === null && timeLeft <= 0 && (
            <p className="game-message">Vaqt tugadi, keyingi savolga o'tilmoqda...</p>
          )}

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

      {!sessionError && state?.status === 'waiting_next' && (
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

      {!sessionError && state?.status === 'finished' && (
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
          </div>

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

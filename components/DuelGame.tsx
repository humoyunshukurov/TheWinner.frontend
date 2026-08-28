import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import BattleBanner from './BattleBanner';
import Avatar from './Avatar';
import QuestionPrompt from './QuestionPrompt';
import PresenceCheckModal from './PresenceCheckModal';
import { IconSwords, IconClock } from './icons';
import { getGuest } from '../lib/guest';
import { loadProfilePhoto } from '../lib/profile';
import { useRequireAccess } from '../lib/useRequireAccess';
import { burstSideConfetti } from '../lib/confetti';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const QUESTION_SECONDS = 15;
const MISSED_QUESTIONS_BEFORE_CHECK = 2;
const PRESENCE_CHECK_SECONDS = 3;
// How long a finished duel is still worth resuming into on mount (e.g. a
// quick refresh right after it ended). Past this, resuming into it would
// mean silently resurfacing an old result every time this component
// mounts - including on the /oyin hub, which embeds it too - instead of
// letting the player start something new.
const RESUME_FINISHED_WINDOW_MS = 2 * 60 * 1000;

// A parent page (the dedicated /oyin/1vs1 screen) needs to be able to
// forfeit the live match on the user's behalf - e.g. after they confirm
// "end the test?" on the back button - without owning any of this
// component's internal match state itself.
export interface DuelGameHandle {
  forfeit: () => Promise<void>;
}

const DuelGame = forwardRef<
  DuelGameHandle,
  { compact?: boolean; resumeFinished?: boolean; onPhaseChange?: (phase: string) => void }
>(
  function DuelGame({ compact, resumeFinished = true, onPhaseChange }, ref) {
    const [phase, setPhase] = useState('idle');
    const [duel, setDuel] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
    const [result, setResult] = useState(null);
    const [reward, setReward] = useState(null);
    const [myPhoto, setMyPhoto] = useState(null);
    const [iAmReady, setIAmReady] = useState(false);
    // Two unanswered questions in a row (timer ran out with nothing
    // selected) pauses the match and asks this player specifically
    // whether they're still there - never shown to the opponent, who's
    // just waiting normally with no idea this is even happening.
    const [presenceCheck, setPresenceCheck] = useState(false);
    const [presenceSecondsLeft, setPresenceSecondsLeft] = useState(PRESENCE_CHECK_SECONDS);

    const pollRef = useRef(null);
    const startTimeRef = useRef(null);
    const guestRef = useRef({ guestId: '', name: '' });
    const duelRef = useRef(null);
    const missedInARowRef = useRef(0);
    const { requireAccess } = useRequireAccess();

    // Kept in sync with `duel` state so the imperative forfeit() below -
    // called from outside React's normal render flow - always sees the
    // current match id, not whatever was captured when the ref was set up.
    useEffect(() => {
      duelRef.current = duel;
    }, [duel]);

    useEffect(() => {
      guestRef.current = getGuest();
      setMyPhoto(loadProfilePhoto(guestRef.current.guestId));
      resumeIfActive();
      return () => clearInterval(pollRef.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      onPhaseChange?.(phase);
    }, [phase, onPhaseChange]);

    useEffect(() => {
      if (phase !== 'playing') return;
      setTimeLeft(QUESTION_SECONDS);
    }, [currentIndex, phase]);

    useEffect(() => {
      if (phase !== 'playing' || !duel || presenceCheck) return;

      if (timeLeft <= 0) {
        handleTimeUp();
        return;
      }

      const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearTimeout(timer);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeft, phase, duel, presenceCheck]);

    // Counts the 3s grace period down once the check is showing, and
    // forfeits on this player's behalf if it runs out with no response.
    useEffect(() => {
      if (!presenceCheck) return;
      setPresenceSecondsLeft(PRESENCE_CHECK_SECONDS);
      const deadline = Date.now() + PRESENCE_CHECK_SECONDS * 1000;
      const interval = setInterval(() => {
        const remaining = Math.ceil((deadline - Date.now()) / 1000);
        if (remaining <= 0) {
          clearInterval(interval);
          confirmAbsentAndForfeit();
          return;
        }
        setPresenceSecondsLeft(remaining);
      }, 200);
      return () => clearInterval(interval);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [presenceCheck]);

    useEffect(() => {
      if (!result || result.winnerGuestId !== guestRef.current.guestId) return;
      return burstSideConfetti(2000);
    }, [result]);

    // Picks up mid-duel exactly where the server says the player actually
    // is - covers both "navigated to another page and came back" (the
    // match kept running server-side the whole time) and a plain page
    // refresh. A brand-new visitor with no duel at all just gets 'none'
    // and the normal idle screen underneath is left untouched.
    function resumeIfActive() {
      const { guestId } = guestRef.current;
      fetch(`${API_URL}/duel/current?guestId=${guestId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 'none') return;

          if (data.status === 'matched') {
            setDuel(data);
            setAnswers(new Array(data.questions.length).fill(null));
            setIAmReady(data.iAmReady);
            setPhase('matched');
            if (!data.bothReady) {
              pollRef.current = setInterval(() => pollReady(data.duelId), 1000);
            }
            return;
          }

          if (data.status === 'playing') {
            setDuel(data);
            setAnswers(new Array(data.questions.length).fill(null));
            startPlaying();
            return;
          }

          if (data.status === 'waiting_opponent') {
            setDuel(data);
            setPhase('waiting_opponent');
            pollRef.current = setInterval(pollResult, 1500);
            return;
          }

          if (data.status === 'finished') {
            // Only worth resuming into if it JUST happened (e.g. a quick
            // refresh right after the match ended) - otherwise this would
            // resurface an old, already-seen result every single time this
            // component mounts. And on the /oyin hub specifically, callers
            // pass resumeFinished={false}: leaving the hub for the home
            // page or another section and coming back should always land
            // back on the mode grid, never hijack it back to the win/loss
            // screen the player already saw and moved past.
            const finishedAt = data.result?.finishedAt;
            const isFresh = finishedAt && Date.now() - finishedAt < RESUME_FINISHED_WINDOW_MS;
            if (resumeFinished && isFresh) {
              setResult(data.result);
              setReward(data.reward);
              setPhase('finished');
            }
          }
        })
        .catch(() => {});
    }

    // Shared by the parent-triggered forfeit (back button, confirmed) and
    // the auto-forfeit below (presence check timed out) - both just need
    // "resign this duel", nothing about how they got there differs.
    async function callForfeitEndpoint() {
      const activeDuel = duelRef.current as any;
      if (!activeDuel?.duelId) return;
      const { guestId } = guestRef.current;
      await fetch(`${API_URL}/duel/${activeDuel.duelId}/forfeit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId })
      }).catch(() => {});
    }

    useImperativeHandle(ref, () => ({
      async forfeit() {
        clearInterval(pollRef.current);
        await callForfeitEndpoint();
      }
    }));

    // Called instead of goToNext() whenever the timer runs out - only
    // pauses on a MISS (nothing selected); answering normally, even right
    // at the buzzer, resets the streak same as clicking "Keyingi savol".
    function handleTimeUp() {
      const wasAnswered = answers[currentIndex] !== null && answers[currentIndex] !== undefined;
      if (wasAnswered) {
        missedInARowRef.current = 0;
        goToNext();
        return;
      }

      missedInARowRef.current += 1;
      if (missedInARowRef.current >= MISSED_QUESTIONS_BEFORE_CHECK) {
        setPresenceCheck(true);
        return;
      }
      goToNext();
    }

    function confirmStillHere() {
      setPresenceCheck(false);
      missedInARowRef.current = 0;
      goToNext();
    }

    async function confirmAbsentAndForfeit() {
      setPresenceCheck(false);
      await callForfeitEndpoint();
      pollResult();
    }

    function enterMatch(data) {
      clearInterval(pollRef.current);
      setDuel(data);
      setAnswers(new Array(data.questions.length).fill(null));
      setIAmReady(false);
      setPhase('matched');
    }

    function startPlaying() {
      clearInterval(pollRef.current);
      setCurrentIndex(0);
      setTimeLeft(QUESTION_SECONDS);
      startTimeRef.current = Date.now();
      setPhase('playing');
    }

    function markReady(duelId) {
      setIAmReady(true);
      const { guestId } = guestRef.current;

      fetch(`${API_URL}/duel/${duelId}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.bothReady) {
            startPlaying();
          } else {
            pollRef.current = setInterval(() => pollReady(duelId), 1000);
          }
        });
    }

    function pollReady(duelId) {
      fetch(`${API_URL}/duel/${duelId}/state`)
        .then((res) => res.json())
        .then((data) => {
          if (data.bothReady) {
            startPlaying();
          }
        });
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

    function goToNext() {
      if (currentIndex < duel.questions.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        handleSubmit();
      }
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
      const activeDuel = duelRef.current as any;
      if (!activeDuel?.duelId) return;
      fetch(`${API_URL}/duel/${activeDuel.duelId}/result?guestId=${guestId}`)
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

    const question = duel?.questions[currentIndex];
    const answered = answers[currentIndex] !== null && answers[currentIndex] !== undefined;
    const isLast = duel && currentIndex === duel.questions.length - 1;
    const me = result?.players.find((p) => p.guestId === guestRef.current.guestId);
    const opponent = result?.players.find((p) => p.guestId !== guestRef.current.guestId);
    const iWon = result && result.winnerGuestId === guestRef.current.guestId;
    const isDraw = result && !result.winnerGuestId;

    return (
      <>
        {phase === 'idle' &&
          (compact ? (
            <BattleBanner onPlay={startSearch} compact />
          ) : (
            <div className="game-hero">
              <div className="game-card battle-card">
                <BattleBanner onPlay={startSearch} />
              </div>
            </div>
          ))}

        {phase === 'searching' && (
          <div className="game-hero">
            <div className="game-card duel-wait-card">
              <h3>Jangni kutish</h3>
              <div className="duel-wait-list">
                <div className="duel-wait-row me">
                  <span className="duel-wait-number">1</span>
                  <Avatar photo={myPhoto} size={40} />
                  <span className="duel-wait-name">{guestRef.current.name}</span>
                </div>
                <div className="duel-wait-row">
                  <span className="duel-wait-number">2</span>
                  <Avatar photo={null} size={40} />
                  <span className="duel-wait-name muted">Kutilmoqda...</span>
                </div>
              </div>
              <p className="muted" style={{ marginTop: 18 }}>
                Jang boshlanishini kuting
              </p>
              <button className="pill-btn" onClick={cancelSearch}>
                Bekor qilish
              </button>
            </div>
          </div>
        )}

        {phase === 'matched' && duel && (
          <div className="game-hero">
            <div className="game-card duel-wait-card">
              <h3>Raqib topildi!</h3>
              <div className="duel-wait-list">
                <div className="duel-wait-row me">
                  <span className="duel-wait-number">1</span>
                  <Avatar photo={myPhoto} size={40} />
                  <span className="duel-wait-name">{guestRef.current.name}</span>
                  {iAmReady && <span className="badge good">Tayyor ✓</span>}
                </div>
                <div className="duel-wait-row">
                  <span className="duel-wait-number">2</span>
                  <Avatar photo={duel.opponent.photo} size={40} />
                  <span className="duel-wait-name">{duel.opponent.name}</span>
                </div>
              </div>
              <p className="muted" style={{ marginTop: 18 }}>
                {iAmReady ? "Raqibingiz tayyor bo'lishini kuting" : 'Ikkalangiz ham tayyor bo\'lgach, o\'yin boshlanadi'}
              </p>
              <button
                className="pill-btn primary quiz-check-btn"
                disabled={iAmReady}
                onClick={() => markReady(duel.duelId)}
              >
                {iAmReady ? 'Kutilmoqda...' : "O'yinni boshlash"}
              </button>
            </div>
          </div>
        )}

        {phase === 'playing' && duel && question && (
          <article className="card quiz-card">
            <div className="duel-vs-banner">
              <span>Siz</span>
              <IconSwords size={16} />
              <span>{duel.opponent.name}</span>
            </div>

            <div className="test-progress-header">
              <span className="test-progress-label">
                Savol {currentIndex + 1} / {duel.questions.length}
              </span>
              <span className={`test-timer-badge ${timeLeft <= 3 ? 'low' : ''}`}>
                <IconClock /> {timeLeft}s
              </span>
            </div>
            <div className="test-progress-bar">
              <div
                className="test-progress-fill"
                style={{ width: `${((currentIndex + 1) / duel.questions.length) * 100}%` }}
              />
            </div>

            <div className="question-block">
              <QuestionPrompt number={currentIndex + 1} text={question.text} image={question.image} />
              <div className="options">
                {question.options.map((option, oIndex) => (
                  <label key={option} className={`option-label ${answers[currentIndex] === oIndex ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name={`duel-q-${currentIndex}`}
                      checked={answers[currentIndex] === oIndex}
                      onChange={() => selectAnswer(currentIndex, oIndex)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <button className="pill-btn primary quiz-check-btn" disabled={!answered} onClick={goToNext}>
              {isLast ? 'Yakunlash' : 'Keyingi savol'}
            </button>
          </article>
        )}

        {presenceCheck && <PresenceCheckModal secondsLeft={presenceSecondsLeft} onConfirm={confirmStillHere} />}

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
            <p className="muted">
              {result.forfeited
                ? iWon
                  ? "Raqibingiz chiqib ketdi - siz g'oliblardansiz! 🎉"
                  : 'Siz testni tark etdingiz'
                : iWon
                  ? 'Siz yutdingiz! 🎉'
                  : isDraw
                    ? 'Durrang!'
                    : 'Siz yutqazdingiz'}
            </p>

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
                +{reward.coins} tanga &middot; +{reward.hp} XP
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
);

export default DuelGame;

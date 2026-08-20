import { useEffect, useRef, useState } from 'react';
import Layout from '../../components/Layout';
import QuestionPrompt from '../../components/QuestionPrompt';
import { IconTrendUp, IconCoin, IconTrophy, IconSparkle } from '../../components/icons';
import { getGuest } from '../../lib/guest';
import { useRequireAccess } from '../../lib/useRequireAccess';
import { burstSideConfetti } from '../../lib/confetti';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const FEEDBACK_DELAY_MS = 650;

export default function MarafonPage() {
  const [phase, setPhase] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [result, setResult] = useState<any>(null);

  const guestRef = useRef({ guestId: '', name: '' });
  const { requireAccess } = useRequireAccess();

  function startGame() {
    requireAccess(doStart);
  }

  // Marafon has no matchmaking/queue/lobby step to actually wait through
  // (unlike 1vs1/Turnir/Kod), so there's nothing for a landing screen
  // with its own "Kirish" to justify - the O'yinlar hub card already
  // asks for that click. Auto-starts once on mount instead; the idle
  // phase below is purely a loading state for the brief round-trip,
  // not an interactive screen the player has to get past.
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (autoStartedRef.current) return;
    autoStartedRef.current = true;
    startGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function doStart() {
    guestRef.current = getGuest();
    setPhase('idle');
    const { guestId } = guestRef.current;

    fetch(`${API_URL}/marafon/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId })
    })
      .then((res) => res.json())
      .then((data) => {
        setSessionId(data.sessionId);
        setQuestion(data.question);
        setStreak(0);
        setSelectedIndex(null);
        setFeedback(null);
        setPhase('playing');
      });
  }

  function selectAnswer(optionIndex: number) {
    if (selectedIndex !== null) return;
    setSelectedIndex(optionIndex);
    const { guestId } = guestRef.current;

    fetch(`${API_URL}/marafon/${sessionId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId, answerIndex: optionIndex })
    })
      .then((res) => res.json())
      .then((data) => {
        setFeedback(data.correct ? 'correct' : 'wrong');

        if (!data.correct) {
          setTimeout(() => {
            setResult(data);
            setPhase('finished');
          }, FEEDBACK_DELAY_MS);
          return;
        }

        setStreak(data.streak);
        setTimeout(() => {
          if (data.allQuestionsUsed) {
            setResult(data);
            setPhase('finished');
            return;
          }
          setQuestion(data.question);
          setSelectedIndex(null);
          setFeedback(null);
        }, FEEDBACK_DELAY_MS);
      });
  }

  function playAgain() {
    setPhase('idle');
    setSessionId(null);
    setQuestion(null);
    setResult(null);
    startGame();
  }

  useEffect(() => {
    if (!result?.allQuestionsUsed) return;
    return burstSideConfetti(4000);
  }, [result]);

  return (
    <Layout title="Infinite Quiz">
      {phase === 'idle' && (
        <div className="game-hero">
          <div className="game-card">
            <div className="duel-spinner" />
          </div>
        </div>
      )}

      {phase === 'playing' && question && (
        <article className="card quiz-card">
          <div className="test-progress-header">
            <span className="test-progress-label">
              <IconTrendUp size={14} /> Ketma-ket to'g'ri: {streak}
            </span>
          </div>

          <div className="question-block">
            <QuestionPrompt text={question.text} image={question.image} />
            <div className="options">
              {question.options.map((option: string, oIndex: number) => {
                let stateClass = '';
                if (selectedIndex === oIndex) {
                  stateClass = feedback === 'wrong' ? 'wrong' : feedback === 'correct' ? 'correct' : 'selected';
                }
                return (
                  <label key={option} className={`option-label ${stateClass}`} onClick={() => selectAnswer(oIndex)}>
                    <input
                      type="radio"
                      name={`marafon-q-${sessionId}`}
                      checked={selectedIndex === oIndex}
                      readOnly
                      disabled={selectedIndex !== null}
                    />
                    {option}
                  </label>
                );
              })}
            </div>
          </div>
        </article>
      )}

      {phase === 'finished' && result && result.allQuestionsUsed && (
        <article className="champion-card">
          <div className="champion-shine" />

          <div className="champion-icon-wrap">
            <IconSparkle size={16} className="champion-sparkle one" />
            <IconSparkle size={14} className="champion-sparkle two" />
            <IconSparkle size={18} className="champion-sparkle three" />
            <IconTrophy size={44} />
          </div>

          <h2 className="champion-title">MUTLAQ G&apos;OLIB!</h2>
          <p className="champion-subtitle">Barcha savollarni birortasida ham xato qilmasdan yakunladingiz!</p>

          <div className="champion-streak">{result.streak}</div>
          <p className="champion-streak-label">ketma-ket to&apos;g&apos;ri javob</p>

          {result.coins > 0 && (
            <div className="champion-reward">
              <IconCoin /> +{result.coins} tanga &middot; +{result.hp} XP
            </div>
          )}

          <div className="action-row" style={{ position: 'relative', justifyContent: 'center' }}>
            <button className="pill-btn primary" onClick={playAgain}>
              Qayta o&apos;ynash
            </button>
          </div>
        </article>
      )}

      {phase === 'finished' && result && !result.allQuestionsUsed && (
        <article className="card">
          <p className="muted">{result.streak > 0 ? "O'yin tugadi!" : 'Birinchi savolda xato bo\'ldi'}</p>
          <div className="result-score">{result.streak}</div>
          <p className="muted">ketma-ket to'g'ri javob</p>

          {result.coins > 0 && (
            <div className="coins-earned-banner">
              <IconCoin /> +{result.coins} tanga &middot; +{result.hp} XP
            </div>
          )}

          <div className="action-row" style={{ marginTop: 18 }}>
            <button className="pill-btn primary" onClick={playAgain}>
              Qayta o'ynash
            </button>
          </div>
        </article>
      )}
    </Layout>
  );
}

import { useEffect, useRef, useState } from 'react';
import Layout from '../../components/Layout';
import MarafonBanner from '../../components/MarafonBanner';
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
  const [starting, setStarting] = useState(false);

  const guestRef = useRef({ guestId: '', name: '' });
  const { requireAccess } = useRequireAccess();

  function startGame() {
    requireAccess(doStart);
  }

  function doStart() {
    guestRef.current = getGuest();
    setStarting(true);
    const { guestId } = guestRef.current;

    fetch(`${API_URL}/marafon/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId })
    })
      .then((res) => res.json())
      .then((data) => {
        setStarting(false);
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
  }

  useEffect(() => {
    if (!result?.allQuestionsUsed) return;
    return burstSideConfetti(4000);
  }, [result]);

  return (
    <Layout eyebrow="Xato qilmasdan qancha uzoqqa borasiz?" title="Infinite Quiz" backHref="/oyin">
      {phase === 'idle' && (
        <div className="game-hero">
          <div className="game-card battle-card">
            <MarafonBanner onPlay={startGame} />
          </div>
          {starting && <p className="muted" style={{ marginTop: 10 }}>Boshlanmoqda...</p>}
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
              <IconCoin /> +{result.coins} tanga &middot; +{result.hp} HP
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
              <IconCoin /> +{result.coins} tanga &middot; +{result.hp} HP
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

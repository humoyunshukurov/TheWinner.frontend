import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { IconCoin, IconSparkle, IconClock } from '../../components/icons';
import { getGuest, isRegistered } from '../../lib/guest';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const QUESTION_SECONDS = 15;

export default function TestPage() {
  const router = useRouter();
  const { id } = router.query;

  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [access, setAccess] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;
    if (isRegistered()) {
      setAccess(true);
    } else {
      router.replace(`/kirish?redirect=${encodeURIComponent(router.asPath)}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  useEffect(() => {
    if (!id || access !== true) return;
    fetch(`${API_URL}/tests/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTest(data);
        setAnswers(new Array(data.questions.length).fill(null));
      })
      .catch(() => {});
  }, [id, access]);

  useEffect(() => {
    setTimeLeft(QUESTION_SECONDS);
  }, [currentIndex]);

  useEffect(() => {
    if (!test || result || submitting) return;

    if (timeLeft <= 0) {
      goToNext();
      return;
    }

    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, test, result, submitting]);

  useEffect(() => {
    if (!result || result.correctCount !== result.total) return;

    let cancelled = false;
    import('canvas-confetti').then(({ default: confetti }) => {
      if (cancelled) return;
      const duration = 3000;
      const end = Date.now() + duration;
      const colors = ['#4f46e5', '#fbbf24', '#22c55e', '#f97316'];

      (function frame() {
        confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors });
        confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors });
        if (Date.now() < end && !cancelled) {
          requestAnimationFrame(frame);
        }
      })();
    });

    return () => {
      cancelled = true;
    };
  }, [result]);

  function selectAnswer(optionIndex) {
    setAnswers((prev) => prev.map((value, i) => (i === currentIndex ? optionIndex : value)));
  }

  function goToNext() {
    if (currentIndex < test.questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      handleSubmit();
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    const { guestId } = getGuest();
    const res = await fetch(`${API_URL}/tests/${id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId, answers })
    });
    const data = await res.json();
    setResult(data);
    setSubmitting(false);
  }

  const question = test?.questions[currentIndex];
  const answered = answers[currentIndex] !== null && answers[currentIndex] !== undefined;
  const isLast = test && currentIndex === test.questions.length - 1;
  const allAnswered = answers.length > 0 && answers.every((a) => a !== null && a !== undefined);

  return (
    <Layout eyebrow="Test" title={test?.title || 'Yuklanmoqda...'}>
      {(!test || access !== true) && <p className="muted">Yuklanmoqda...</p>}

      {access === true && test && !result && question && (
        <article className="card">
          <div className="test-progress-header">
            <span className="test-progress-label">
              Savol {currentIndex + 1} / {test.questions.length}
            </span>
            <span className={`test-timer-badge ${timeLeft <= 3 ? 'low' : ''}`}>
              <IconClock /> {timeLeft}s
            </span>
          </div>
          <div className="test-progress-bar">
            <div
              className="test-progress-fill"
              style={{ width: `${((currentIndex + 1) / test.questions.length) * 100}%` }}
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
                    name={`question-${currentIndex}`}
                    checked={answers[currentIndex] === oIndex}
                    onChange={() => selectAnswer(oIndex)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          <button className="pill-btn primary" disabled={!answered || submitting} onClick={goToNext}>
            {submitting ? 'Yuborilmoqda...' : isLast ? 'Yakunlash' : 'Keyingi savol'}
          </button>
        </article>
      )}

      {result && (
        <>
          <article className="card">
            {allAnswered && (
              <div className="congrats-banner">
                <span className="congrats-emoji">🎉</span>
                Tabriklaymiz! Barcha savollarga javob berdingiz!
              </div>
            )}

            <p className="muted">Natijangiz</p>
            <div className="result-score">
              {result.score} / {result.maxScore} ball
            </div>
            <p className="muted">
              {result.correctCount} ta savoldan {result.total} tasiga to'g'ri javob berdingiz.
            </p>

            {result.passed ? (
              <div className="coins-earned-banner">
                <IconCoin /> +{result.coinsEarned} coin qo'lga kiritdingiz!
              </div>
            ) : (
              <p className="locked-hint">
                {result.passThreshold} balldan ko'proq to'plasangiz, coin va qiziqarli ma'lumotlar ochiladi.
              </p>
            )}

            <div className="action-row" style={{ marginTop: 18 }}>
              <Link href="/testlar" className="pill-btn primary">
                Testlarga qaytish
              </Link>
              <Link href="/reyting" className="pill-btn">
                Reytingni ko'rish
              </Link>
            </div>
          </article>

          {result.breakdown?.length > 0 && (
            <article className="card">
              <div className="card-header">
                <h3>Savollar tahlili</h3>
                <span className="select-chip">
                  {result.correctCount} / {result.total} to'g'ri
                </span>
              </div>
              <div className="review-list">
                {result.breakdown.map((item, index) => (
                  <div className={`review-item ${item.isCorrect ? 'correct' : 'wrong'}`} key={item.text}>
                    <span className="review-icon">{item.isCorrect ? '✓' : '✕'}</span>
                    <div className="review-body">
                      <p className="review-question">
                        {index + 1}. {item.text}
                      </p>
                      <p className="review-answer">
                        Sizning javobingiz: <strong>{item.yourAnswerText ?? 'Belgilanmagan'}</strong>
                      </p>
                      {!item.isCorrect && (
                        <p className="review-answer correct-answer">
                          To'g'ri javob: <strong>{item.correctAnswer}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )}

          {result.passed && result.funFacts?.length > 0 && (
            <article className="card facts-card">
              <div className="card-header">
                <h3>
                  <IconSparkle size={18} /> Qiziqarli ma'lumotlar
                </h3>
                <span className="select-chip">Ochildi</span>
              </div>
              <ul className="facts-list">
                {result.funFacts.map((fact, index) => (
                  <li key={fact}>
                    <strong>{index + 1}.</strong> {fact}
                  </li>
                ))}
              </ul>
            </article>
          )}
        </>
      )}
    </Layout>
  );
}

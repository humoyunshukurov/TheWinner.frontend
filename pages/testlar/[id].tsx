import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { IconCoin, IconSparkle, IconClock, IconTrophy } from '../../components/icons';
import { getGuest, isRegistered } from '../../lib/guest';
import { burstSideConfetti } from '../../lib/confetti';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const DEFAULT_QUESTION_SECONDS = 15;

export default function TestPage() {
  const router = useRouter();
  const { id } = router.query;

  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_QUESTION_SECONDS);
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
    const { guestId } = getGuest();
    fetch(`${API_URL}/tests/${id}?guestId=${guestId}`)
      .then((res) => res.json())
      .then((data) => {
        setTest(data);
        setAnswers(new Array(data.questions.length).fill(null));
      })
      .catch(() => {});
  }, [id, access]);

  useEffect(() => {
    setTimeLeft(test?.questionSeconds || DEFAULT_QUESTION_SECONDS);
  }, [currentIndex, test]);

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
    return burstSideConfetti(4000);
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
  const isPerfect = result && result.total > 0 && result.correctCount === result.total;

  return (
    <Layout eyebrow="Test" title={test?.title || 'Yuklanmoqda...'}>
      {(!test || access !== true) && <p className="muted">Yuklanmoqda...</p>}

      {access === true && test && !result && question && (
        <article className="card quiz-card">
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

          <button className="pill-btn primary quiz-check-btn" disabled={!answered || submitting} onClick={goToNext}>
            {submitting ? 'Yuborilmoqda...' : isLast ? 'Yakunlash' : 'Keyingi savol'}
          </button>
        </article>
      )}

      {result && (
        <>
          {isPerfect ? (
            <article className="champion-card">
              <div className="champion-shine" />

              <div className="champion-icon-wrap">
                <IconSparkle size={16} className="champion-sparkle one" />
                <IconSparkle size={14} className="champion-sparkle two" />
                <IconSparkle size={18} className="champion-sparkle three" />
                <IconTrophy size={44} />
              </div>

              <h2 className="champion-title">MUKAMMAL NATIJA!</h2>
              <p className="champion-subtitle">Barcha savollarga to&apos;g&apos;ri javob berdingiz!</p>

              <div className="champion-streak">
                {result.correctCount}/{result.total}
              </div>
              <p className="champion-streak-label">to&apos;g&apos;ri javob</p>

              {result.coinsEarned > 0 ? (
                <div className="champion-reward">
                  <IconCoin /> +{result.coinsEarned} coin qo&apos;lga kiritdingiz!
                </div>
              ) : (
                <div className="champion-reward already">
                  <IconCoin /> Bu testni avval yechib bo&apos;lgansiz, shuning uchun coin qayta berilmaydi
                </div>
              )}

              <div className="action-row" style={{ position: 'relative', justifyContent: 'center' }}>
                <Link href="/testlar" className="pill-btn primary">
                  Testlarga qaytish
                </Link>
                <Link href="/reyting" className="pill-btn">
                  Reytingni ko&apos;rish
                </Link>
              </div>
            </article>
          ) : (
            <article className="card">
              {allAnswered && (
                <div className="congrats-banner">
                  <span className="congrats-emoji">🎉</span>
                  Tabriklaymiz! Barcha savollarga javob berdingiz!
                </div>
              )}

              <p className="muted">Natijangiz</p>
              <div className="result-score">
                {result.correctCount} / {result.total}
              </div>
              <p className="muted">
                {result.correctCount} ta savoldan {result.total} tasiga to'g'ri javob berdingiz.
              </p>

              {result.passed && result.coinsEarned > 0 && (
                <div className="coins-earned-banner">
                  <IconCoin /> +{result.coinsEarned} coin qo'lga kiritdingiz!
                </div>
              )}

              {result.passed && result.coinsEarned === 0 && (
                <div className="coins-earned-banner already">
                  <IconCoin /> Bu testni avval yechib bo'lgansiz, shuning uchun coin qayta berilmaydi
                </div>
              )}

              {!result.passed && (
                <p className="locked-hint">
                  Savollarning {result.passThresholdPercent}% dan ko'prog'iga to'g'ri javob bersangiz, coin va
                  qiziqarli ma'lumotlar ochiladi.
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
          )}

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

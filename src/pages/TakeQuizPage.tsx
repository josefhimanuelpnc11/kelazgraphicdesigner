import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { firestoreService } from '../services/firestore';
import type { QuestionDoc, QuizDoc } from '../types';
import { useAuth } from '../hooks/useAuth';
import '../components/Dashboard.css';

const TakeQuizPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<(QuizDoc & { id: string }) | null>(null);
  const [questions, setQuestions] = useState<(QuestionDoc & { id: string })[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [retakeAllowed, setRetakeAllowed] = useState<number>(0);

  useEffect(() => {
    const run = async () => {
      if (!quizId) return;
      setLoading(true);
      setError(null);
      try {
        // Minimal fetch: find quiz from list then its questions
        const all = await firestoreService.getQuizzes();
        const q = all.find(x => x.id === quizId) || null;
        setQuiz(q);
    if (q) {
          const qs = await firestoreService.getQuestions(q.id);
          setQuestions(qs);
          if (user) {
            const prev = await firestoreService.getAnswersByUser(user.uid, q.id);
            if (prev.length > 0) {
              setAlreadyDone(true);
            }
      const grant = await firestoreService.getRetakeGrant(user.uid, q.id);
      setRetakeAllowed(grant?.allowed ?? 0);
          }
        }
      } catch (e: any) {
        setError(e?.message || 'Gagal memuat kuis');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [quizId, user]);

  const canSubmit = useMemo(() => questions.length > 0, [questions]);

  const computeSubmission = useCallback(() => {
    // Build flat answers: for simplicity, only auto-grade single-index types
    return questions.map(q => {
      let selectedIndex = -1;
      let textAnswer: string | undefined = undefined;
      if (q.type === 'multiple_choice' || q.type === 'dropdown') {
        selectedIndex = typeof answers[q.id] === 'number' ? answers[q.id] : -1;
      } else if (q.type === 'checkboxes') {
        // not auto-graded here, mark incorrect unless exact match (out of scope for now)
        const arr: number[] = Array.isArray(answers[q.id]) ? answers[q.id] : [];
        selectedIndex = arr.length ? -2 : -1; // sentinel for multi
      } else {
        // text types, store as -1 (not auto-graded) + capture text
        selectedIndex = -1;
        textAnswer = typeof answers[q.id] === 'string' ? (answers[q.id] as string) : '';
      }
      const isCorrect = typeof q.correctIndex === 'number' && selectedIndex === q.correctIndex;
      return { questionId: q.id, selectedIndex, isCorrect, textAnswer };
    });
  }, [questions, answers]);

  const submitQuiz = useCallback(async () => {
    if (!user || !quiz) return;
    if (submittedRef.current) return; // idempotent
    submittedRef.current = true;
    try {
      setSubmitting(true);
      // If this is a retake (already has answers) and a grant exists, consume 1
      try {
        const prev = await firestoreService.getAnswersByUser(user.uid, quiz.id);
        if (prev.length > 0) {
          await firestoreService.consumeRetake(user.uid, quiz.id);
        }
      } catch {}
      const items = computeSubmission();
      await firestoreService.replaceAnswers(user.uid, quiz.id, items);
      alert('Kuis selesai. Jawaban telah disimpan.');
      window.location.hash = '#/dashboard';
    } catch (e: any) {
      console.error(e);
      alert('Gagal menyimpan jawaban.');
    } finally {
      setSubmitting(false);
    }
  }, [user, quiz, computeSubmission]);

  // Auto-submit when the tab loses focus or becomes hidden
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        submitQuiz();
      }
    };
    const onBlur = () => {
      submitQuiz();
    };
    const onPageHide = () => {
      submitQuiz();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [submitQuiz]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="dashboard-main">
        <div className="container">
          <div className="loading-state"><div className="loading-spinner" /><p>Memuat kuis...</p></div>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="dashboard-main">
        <div className="container">
          {error ? <div className="error-message">{error}</div> : <div className="card"><p>Kuis tidak ditemukan.</p></div>}
          <Link className="btn-secondary" to="/belajar" style={{ display: 'inline-block', marginTop: 12 }}>Kembali ke Belajar</Link>
        </div>
      </div>
    );
  }

  if (alreadyDone && retakeAllowed <= 0) {
    return (
      <div className="dashboard-main">
        <div className="container">
          <div className="card" style={{ maxWidth: 720, margin: '0 auto' }}>
            <div className="card-content">
              <h3 style={{ marginTop: 0 }}>Kuis Sudah Diselesaikan</h3>
              <p>Anda telah menyelesaikan kuis ini. Silakan kembali ke halaman Belajar atau Dashboard.</p>
              <div className="form-actions">
                <Link className="btn-secondary" to="/belajar">Kembali ke Belajar</Link>
                <Link className="btn-primary" to="/dashboard">Ke Dashboard</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const showRetakeInfo = alreadyDone && retakeAllowed > 0;

  return (
    <div className="dashboard-main take-quiz">
      <div className="container">
        <div className="card" style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: 8 }}>
            <Link to="/belajar" className="btn-secondary" style={{ display: 'inline-block' }}>← Kembali ke Belajar</Link>
          </div>
          <h1 style={{ marginTop: 0 }}>{quiz.title}</h1>
          {quiz.timeLimitSec && <p style={{ color: '#64748b' }}>Batas waktu: {Math.round(quiz.timeLimitSec / 60)} menit</p>}
          {showRetakeInfo && (
            <div className="card" style={{ background: '#f8fafc', border: '1px dashed #94a3b8', padding: 12, marginBottom: 12 }}>
              <p style={{ margin: 0 }}>Guru telah memberikan akses ulang untuk kuis ini. Sisa kesempatan: <strong>{retakeAllowed}</strong>.</p>
            </div>
          )}
          {questions.length === 0 ? (
            <div className="empty-state">Belum ada pertanyaan.</div>
          ) : (
            <form className="form-grid" onSubmit={(e) => { e.preventDefault(); submitQuiz(); }}>
              {questions.map((q, idx) => (
                <div key={q.id} className="content-card">
                  <div className="card-content">
                    <h4 style={{ marginTop: 0 }}>Pertanyaan {idx + 1}</h4>
                    {q.imageUrl && (
                      <div style={{ marginBottom: 10 }}>
                        <img
                          src={resolveImage(q.imageUrl)}
                          alt={q.imageAlt || 'Ilustrasi pertanyaan'}
                          style={{ maxWidth: '100%', height: 'auto', borderRadius: 8, display: 'block' }}
                          loading="lazy"
                        />
                      </div>
                    )}
                    <p style={{ whiteSpace: 'pre-wrap' }}>{q.text}</p>
                    {q.type === 'multiple_choice' && q.options && (
                      <div className="quiz-options">
                        {q.options.map((opt, i) => (
                          <label key={i} style={{ display: 'block', marginBottom: 6 }}>
                            <input
                              type="radio"
                              name={`q_${q.id}`}
                              value={i}
                              onChange={() => setAnswers(a => ({ ...a, [q.id]: i }))}
                              checked={answers[q.id] === i}
                            />{' '}
                            {opt}
                          </label>
                        ))}
                      </div>
                    )}
                    {q.type === 'checkboxes' && q.options && (
                      <div className="quiz-options">
                        {q.options.map((opt, i) => (
                          <label key={i} style={{ display: 'block', marginBottom: 6 }}>
                            <input
                              type="checkbox"
                              value={i}
                              onChange={(e) => {
                                setAnswers(a => {
                                  const curr: number[] = Array.isArray(a[q.id]) ? a[q.id] : [];
                                  const next = new Set(curr);
                                  if (e.target.checked) next.add(i); else next.delete(i);
                                  return { ...a, [q.id]: Array.from(next).sort() };
                                });
                              }}
                              checked={Array.isArray(answers[q.id]) && answers[q.id].includes(i)}
                            />{' '}
                            {opt}
                          </label>
                        ))}
                      </div>
                    )}
                    {q.type === 'dropdown' && q.options && (
                      <select value={answers[q.id] ?? ''} onChange={(e) => setAnswers(a => ({ ...a, [q.id]: Number(e.target.value) }))}>
                        <option value="" disabled>Pilih jawaban</option>
                        {q.options.map((opt, i) => (
                          <option key={i} value={i}>{opt}</option>
                        ))}
                      </select>
                    )}
                    {q.type === 'short_answer' && (
                      <div className="form-group">
                        <input
                          type="text"
                          className="w-full p-4 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Jawaban singkat"
                          value={answers[q.id] ?? ''}
                          onChange={(e) => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                        />
                      </div>
                    )}
                    {q.type === 'paragraph' && (
                      <div className="form-group">
                        <textarea
                          className="w-full p-4 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[140px] md:min-h-[180px] resize-y"
                          placeholder="Jawaban panjang"
                          rows={6}
                          value={answers[q.id] ?? ''}
                          onChange={(e) => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary" disabled={!canSubmit || submitting}>{submitting ? 'Menyimpan...' : 'Kumpulkan'}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper to resolve image path supporting public/ base path and ~/ shorthand
function resolveImage(pathLike?: string): string {
  if (!pathLike) return '';
  if (/^https?:\/\//i.test(pathLike)) return pathLike;
  // '~/...' maps to public root; Vite serves from '/'
  const cleaned = pathLike.startsWith('~/') ? pathLike.slice(1) : pathLike;
  // Respect Vite base path for GH Pages
  const base = (import.meta as any).env?.BASE_URL || '/';
  // Avoid double slashes
  return (base + cleaned.replace(/^\//, '')).replace(/\/+/g, '/');
}

export default TakeQuizPage;

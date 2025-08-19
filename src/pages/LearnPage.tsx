import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { firestoreService } from '../services/firestore';
import type { LessonDoc, ModuleDoc, QuizDoc, AnswerDoc, LessonReadDoc } from '../types';
import '../components/Dashboard.css';
import { Link } from 'react-router-dom';

type ModuleBundle = {
  module: ModuleDoc & { id: string };
  lessons: (LessonDoc & { id: string })[];
  quizzes: (QuizDoc & { id: string })[];
};

export const LearnPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bundles, setBundles] = useState<ModuleBundle[]>([]);
  const [answers, setAnswers] = useState<(AnswerDoc & { id: string })[]>([]);
  const [reads, setReads] = useState<(LessonReadDoc & { id: string })[]>([]);
  const [retakeAllowedQuizIds, setRetakeAllowedQuizIds] = useState<Set<string>>(new Set());
  const [confirmQuizId, setConfirmQuizId] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
  const modules = await firestoreService.getModules();
  // Auto-enroll concept: show all visible modules to every student
  const enrolledModules = modules.filter(m => (m.visible ?? true));

        const bundles: ModuleBundle[] = [];
        for (const m of enrolledModules) {
          const [lessons, quizzes] = await Promise.all([
            firestoreService.getLessons(m.id),
            firestoreService.getQuizzes(m.id),
          ]);
          // Students see only visible lessons
          const visibleLessons = lessons.filter(l => (l.visible ?? true));
          bundles.push({ module: m, lessons: visibleLessons, quizzes });
        }
        setBundles(bundles);

        const [ans, rds, grants] = await Promise.all([
          firestoreService.getAnswersByUser(user.uid),
          firestoreService.getLessonReadsByUser(user.uid),
          firestoreService.getRetakeGrantsByUser(user.uid)
        ]);
        setAnswers(ans);
        setReads(rds);
        setRetakeAllowedQuizIds(new Set((grants || []).filter(g => (g.allowed ?? 0) > 0).map(g => g.quizId)));
      } catch (e: any) {
        setError(e?.message || 'Gagal memuat data belajar');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user]);

  const answeredQuizIds = useMemo(() => new Set(answers.map(a => a.quizId)), [answers]);
  const readLessonKey = useMemo(() => new Set(reads.map(r => `${r.moduleId}:${r.lessonId}`)), [reads]);

  if (!user) return null;

  return (
    <div className="dashboard-main">
      <div className="container">
        <h1 style={{ marginTop: 0 }}>Belajar</h1>
        <div style={{ marginTop: 8, marginBottom: 16 }}>
          <Link className="btn-secondary" to="/dashboard" style={{ display: 'inline-block', width: 'auto' }}>← Kembali ke Dashboard</Link>
        </div>
        {error && <div className="error-message">{error}</div>}
        {loading ? (
          <div className="loading-state"><div className="loading-spinner" /><p>Memuat konten belajar...</p></div>
  ) : (
          <div className="content-grid" style={{ gridTemplateColumns: '1fr' }}>
            {bundles.map(b => {
              const doneCount = b.quizzes.filter(q => answeredQuizIds.has(q.id)).length;
              const readCount = b.lessons.filter(l => readLessonKey.has(`${b.module.id}:${l.id}`)).length;
              const lessonPct = b.lessons.length > 0 ? Math.round((readCount / b.lessons.length) * 100) : 0;
              const quizPct = b.quizzes.length > 0 ? Math.round((doneCount / b.quizzes.length) * 100) : 0;
              return (
                <div key={b.module.id} className="content-card">
                  <div className="card-header">
                    <div className="module-order">BAB</div>
                    <div className="card-actions" />
                  </div>
                  <div className="card-content">
                    <h4>{b.module.title}</h4>
                    {b.module.description && <p>{b.module.description}</p>}
                    <div className="card-meta">
                      <span>{b.lessons.length} materi</span>
                      <span>{b.quizzes.length} kuis</span>
                      <span>{doneCount}/{b.quizzes.length} kuis selesai</span>
                    </div>
                    <div className="course-progress" style={{ marginTop: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ color: '#374151', fontWeight: 600, fontSize: 13 }}>Progress Materi</span>
                        <span style={{ color: '#64748b', fontSize: 12 }}>{readCount}/{b.lessons.length}</span>
                      </div>
                      <div className="progress-bar small">
                        <div className="progress-fill" style={{ width: `${lessonPct}%` }} />
                      </div>
                    </div>
                    <div className="course-progress" style={{ marginTop: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ color: '#374151', fontWeight: 600, fontSize: 13 }}>Progress Kuis</span>
                        <span style={{ color: '#64748b', fontSize: 12 }}>{doneCount}/{b.quizzes.length}</span>
                      </div>
                      <div className="progress-bar small">
                        <div className="progress-fill" style={{ width: `${quizPct}%` }} />
                      </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <h5 style={{ margin: '8px 0' }}>Materi</h5>
                      {b.lessons.length === 0 ? (
                        <div className="empty-state">Belum ada materi</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {b.lessons.map(l => {
                            const isRead = readLessonKey.has(`${b.module.id}:${l.id}`);
                            return (
                              <Link
                                key={l.id}
                                to={`/belajar/m/${b.module.id}/lesson/${l.id}`}
                                className={`btn-action secondary`}
                                style={{ textAlign: 'left' }}
                              >
                                <i>📘</i>
                                <span style={{ flex: 1 }}>{l.title}</span>
                                {isRead && <span style={{ color: '#059669', fontWeight: 700 }}>✓</span>}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <h5 style={{ margin: '8px 0' }}>Kuis</h5>
                      {b.quizzes.length === 0 ? (
                        <div className="empty-state">Belum ada kuis</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {b.quizzes.map(q => {
                            const lesson = q.lessonId ? b.lessons.find(l => l.id === q.lessonId) : undefined;
                            const done = answeredQuizIds.has(q.id);
                            const hasRetake = retakeAllowedQuizIds.has(q.id);
                            const canStart = (!q.lessonId || readLessonKey.has(`${b.module.id}:${q.lessonId}`)) && (!done || hasRetake);
                            const labelExtra = done && !hasRetake ? '✓ Selesai' : (done && hasRetake ? '(Akses ulang tersedia)' : '');
                            return (
                              <button
                                key={q.id}
                                type="button"
                                className="btn-action primary"
                                onClick={() => canStart && setConfirmQuizId(q.id)}
                                disabled={!canStart}
                                title={canStart ? 'Mulai kuis' : 'Baca materi terlebih dahulu'}
                                style={{
                                  opacity: canStart ? 1 : 0.6,
                                  cursor: canStart ? 'pointer' : 'not-allowed',
                                  textAlign: 'left'
                                }}
                              >
                                <i>📝</i>
                                <span style={{ flex: 1 }}>{q.title}</span>
                                {labelExtra && <span style={{ color: done ? '#059669' : '#0ea5e9', fontWeight: 700 }}>{labelExtra}</span>}
                                {lesson && (
                                  <span style={{ marginLeft: 8, color: '#64748b', fontStyle: 'italic' }}>
                                    (Materi: {lesson.title})
                                  </span>
                                )}
                                {!canStart && lesson && (
                                  <span style={{ marginLeft: 8, color: '#ef4444' }}>
                                    — Baca "{lesson.title}" dulu
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {confirmQuizId && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-container" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2>Konfirmasi Mulai Kuis</h2>
              <button className="close-btn" onClick={() => setConfirmQuizId(null)} aria-label="Tutup">×</button>
            </div>
            <div className="modal-content">
              {(() => {
                // Cari detail kuis dan materi untuk teks konfirmasi
                const quizBundle = bundles.find(b => b.quizzes.some(q => q.id === confirmQuizId));
                const quiz = quizBundle?.quizzes.find(q => q.id === confirmQuizId);
                const lesson = quiz?.lessonId ? quizBundle?.lessons.find(l => l.id === quiz.lessonId) : undefined;
                return (
                  <>
                    <p>Anda akan mengerjakan kuis: <strong>{quiz?.title}</strong></p>
                    {lesson && <p>Kuis ini terkait materi: <em>{lesson.title}</em></p>}
                    {quiz?.timeLimitSec && <p>Batas waktu: {Math.round((quiz.timeLimitSec)/60)} menit</p>}
                  </>
                );
              })()}
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setConfirmQuizId(null)}>Tidak</button>
              <button
                className="btn-primary"
                onClick={() => {
                  const id = confirmQuizId; setConfirmQuizId(null);
                  window.location.hash = `#/kuis/${id}`;
                }}
              >Siap, Lanjut</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearnPage;

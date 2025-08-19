import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { firestoreService } from '../services/firestore';
import type { QuizDoc, LessonDoc, ModuleDoc, AnswerDoc, LessonReadDoc } from '../types';
import '../components/Dashboard.css';

type LessonsMap = Record<string, Array<LessonDoc & { id: string }>>; // moduleId -> lessons[]

export const QuizzesPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<Array<QuizDoc & { id: string }>>([]);
  const [modules, setModules] = useState<Array<ModuleDoc & { id: string }>>([]);
  const [lessonsMap, setLessonsMap] = useState<LessonsMap>({});
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
        // Load modules and lessons (for labels and gating)
        const mods = await firestoreService.getModules();
        const visibleModules = mods.filter(m => (m.visible ?? true));
        setModules(visibleModules);
        const lessonsMapLocal: LessonsMap = {};
        for (const m of visibleModules) {
          lessonsMapLocal[m.id] = await firestoreService.getLessons(m.id);
        }
        setLessonsMap(lessonsMapLocal);

        // Load quizzes (all), answers, reads, and retake grants
        const [qz, ans, rds, grants] = await Promise.all([
          firestoreService.getQuizzes(),
          firestoreService.getAnswersByUser(user.uid),
          firestoreService.getLessonReadsByUser(user.uid),
          firestoreService.getRetakeGrantsByUser(user.uid)
        ]);
        setQuizzes(qz);
        setAnswers(ans);
        setReads(rds);
        setRetakeAllowedQuizIds(new Set((grants || []).filter(g => (g.allowed ?? 0) > 0).map(g => g.quizId)));
      } catch (e: any) {
        setError(e?.message || 'Gagal memuat daftar kuis');
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
        <h1 style={{ marginTop: 0 }}>Kuis</h1>
        <div style={{ marginTop: 8, marginBottom: 16 }}>
          <Link className="btn-secondary" to="/dashboard" style={{ display: 'inline-block', width: 'auto' }}>← Kembali ke Dashboard</Link>
        </div>
        {error && <div className="error-message">{error}</div>}
        {loading ? (
          <div className="loading-state"><div className="loading-spinner" /><p>Memuat kuis...</p></div>
        ) : (
          <div className="content-grid" style={{ gridTemplateColumns: '1fr' }}>
            {quizzes.length === 0 ? (
              <div className="empty-state">Belum ada kuis tersedia.</div>
            ) : (
              quizzes.map(q => {
                const moduleTitle = modules.find(m => m.id === q.moduleId)?.title || 'Umum';
                const lesson = q.lessonId && q.moduleId ? (lessonsMap[q.moduleId]?.find(l => l.id === q.lessonId)) : undefined;
                const done = answeredQuizIds.has(q.id);
                const hasRetake = retakeAllowedQuizIds.has(q.id);
                const canStart = (!q.lessonId || (q.moduleId && readLessonKey.has(`${q.moduleId}:${q.lessonId}`))) && (!done || hasRetake);
                const labelExtra = done && !hasRetake ? '✓ Selesai' : (done && hasRetake ? '(Akses ulang tersedia)' : '');
                return (
                  <div key={q.id} className="content-card">
                    <div className="card-header">
                      <div className="lesson-order">KUIS</div>
                      <div className="card-actions" />
                    </div>
                    <div className="card-content">
                      <h4>{q.title}</h4>
                      <p style={{ marginBottom: 8 }}>Bab: <strong>{moduleTitle}</strong></p>
                      {q.timeLimitSec && <p style={{ color: '#64748b' }}>Batas waktu: {Math.round(q.timeLimitSec/60)} menit</p>}
                      {lesson && (
                        <p style={{ marginTop: 4, fontStyle: 'italic', color: '#64748b' }}>Materi terkait: {lesson.title}</p>
                      )}
                      {!canStart && lesson && (
                        <p style={{ color: '#ef4444' }}>Baca materi "{lesson.title}" terlebih dahulu agar bisa mulai.</p>
                      )}
                      <div className="form-actions" style={{ justifyContent: 'space-between' }}>
                        <button
                          className="btn-action primary"
                          onClick={() => canStart && setConfirmQuizId(q.id)}
                          disabled={!canStart}
                          style={{ opacity: canStart ? 1 : 0.6, cursor: canStart ? 'pointer' : 'not-allowed' }}
                        >
                          📝 Mulai Kuis
                        </button>
                        <span style={{ alignSelf: 'center', color: done ? '#059669' : '#94a3b8', fontWeight: 600 }}>{labelExtra}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
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
                const q = quizzes.find(x => x.id === confirmQuizId);
                const modTitle = modules.find(m => m.id === q?.moduleId)?.title || 'Umum';
                const lesson = (q?.lessonId && q?.moduleId) ? lessonsMap[q.moduleId]?.find(l => l.id === q.lessonId) : undefined;
                return (
                  <>
                    <p>Anda akan mengerjakan kuis: <strong>{q?.title}</strong></p>
                    <p>Bab: <strong>{modTitle}</strong></p>
                    {lesson && <p>Kuis ini terkait materi: <em>{lesson.title}</em></p>}
                    {q?.timeLimitSec && <p>Batas waktu: {Math.round((q.timeLimitSec)/60)} menit</p>}
                  </>
                );
              })()}
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setConfirmQuizId(null)}>Tidak</button>
              <button
                className="btn-primary"
                onClick={() => { const id = confirmQuizId; setConfirmQuizId(null); window.location.hash = `#/kuis/${id}`; }}
              >Siap, Lanjut</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizzesPage;

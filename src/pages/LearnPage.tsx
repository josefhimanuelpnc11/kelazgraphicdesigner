import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { firestoreService } from '../services/firestore';
import type { LessonDoc, ModuleDoc, QuizDoc, AnswerDoc } from '../types';
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
          bundles.push({ module: m, lessons, quizzes });
        }
        setBundles(bundles);

        const ans = await firestoreService.getAnswersByUser(user.uid);
        setAnswers(ans);
      } catch (e: any) {
        setError(e?.message || 'Gagal memuat data belajar');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user]);

  const answeredQuizIds = useMemo(() => new Set(answers.map(a => a.quizId)), [answers]);

  if (!user) return null;

  return (
    <div className="dashboard-main">
      <div className="container">
        <h1 style={{ marginTop: 0 }}>Belajar</h1>
        {error && <div className="error-message">{error}</div>}
        {loading ? (
          <div className="loading-state"><div className="loading-spinner" /><p>Memuat konten belajar...</p></div>
  ) : (
          <div className="content-grid" style={{ gridTemplateColumns: '1fr' }}>
            {bundles.map(b => {
              const doneCount = b.quizzes.filter(q => answeredQuizIds.has(q.id)).length;
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
                    <div style={{ marginTop: 12 }}>
                      <h5 style={{ margin: '8px 0' }}>Materi</h5>
                      {b.lessons.length === 0 ? (
                        <div className="empty-state">Belum ada materi</div>
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {b.lessons.map(l => (
                            <li key={l.id}>
                              <Link to={`/belajar/m/${b.module.id}/lesson/${l.id}`}>{l.title}</Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <h5 style={{ margin: '8px 0' }}>Kuis</h5>
                      {b.quizzes.length === 0 ? (
                        <div className="empty-state">Belum ada kuis</div>
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {b.quizzes.map(q => (
                            <li key={q.id}>
                              {q.title} {answeredQuizIds.has(q.id) ? '✓' : ''}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnPage;

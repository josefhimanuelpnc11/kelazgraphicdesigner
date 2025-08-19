import React, { useEffect, useState } from 'react';
import { firestoreService } from '../services/firestore';
import type { LessonDoc, ModuleDoc, QuestionDoc, QuizDoc, UserDoc, RetakeGrantDoc } from '../types';
import { useAuth } from '../hooks/useAuth';

interface ManageQuizzesProps {
  onClose: () => void;
}

export const ManageQuizzes: React.FC<ManageQuizzesProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<(QuizDoc & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{ title: string; timeLimitMin: number }>({ title: '', timeLimitMin: 10 });
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);
  const [modules, setModules] = useState<(ModuleDoc & { id: string })[]>([]);
  const [lessons, setLessons] = useState<(LessonDoc & { id: string })[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [questionMap, setQuestionMap] = useState<Record<string, (QuestionDoc & { id: string })[]>>({});
  const [loadingQuestions, setLoadingQuestions] = useState<string | null>(null);
  const [retakeQuizId, setRetakeQuizId] = useState<string | null>(null);
  const [students, setStudents] = useState<(UserDoc & { id: string })[]>([]);
  const [retakeData, setRetakeData] = useState<{
    completions: Record<string, { lastAnsweredAt?: number }>;
    grants: Array<RetakeGrantDoc & { id: string }>;
  } | null>(null);
  const [retakeLoading, setRetakeLoading] = useState(false);
  const [granting, setGranting] = useState(false);
  const [grantCount, setGrantCount] = useState(1);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const load = async () => {
    try {
      setLoading(true);
      const [items, mods, allLessons, studs] = await Promise.all([
        firestoreService.getQuizzes(),
        firestoreService.getModules(),
        firestoreService.getAllLessons(),
        firestoreService.getStudents(),
      ]);
      setQuizzes(items);
      setModules(mods);
      setLessons(allLessons);
      setStudents(studs);
      setError(null);
    } catch (e) {
      setError('Gagal memuat daftar kuis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startEdit = (q: QuizDoc & { id: string }) => {
    setEditingId(q.id);
    setForm({ title: q.title, timeLimitMin: Math.max(1, Math.round((q.timeLimitSec ?? 600) / 60)) });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await firestoreService.updateQuiz(editingId, {
        title: form.title.trim(),
        timeLimitSec: Math.max(60, form.timeLimitMin * 60),
      });
      setEditingId(null);
      await load();
    } catch (e) {
      alert('Gagal menyimpan perubahan kuis');
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      await firestoreService.deleteQuiz(confirmDelete.id);
      setConfirmDelete(null);
      await load();
    } catch (e) {
      alert('Gagal menghapus kuis');
    }
  };

  const moduleTitle = (id?: string) => modules.find(m => m.id === id)?.title || '-';
  const lessonTitle = (id?: string) => lessons.find(l => l.id === id)?.title || '-';

  const toggleExpand = async (quizId: string) => {
    setExpandedId(prev => (prev === quizId ? null : quizId));
    if (!questionMap[quizId]) {
      try {
        setLoadingQuestions(quizId);
        const qs = await firestoreService.getQuestions(quizId);
        setQuestionMap(prev => ({ ...prev, [quizId]: qs }));
      } finally {
        setLoadingQuestions(null);
      }
    }
  };

  const openRetakeManager = async (quizId: string) => {
    setRetakeQuizId(quizId);
    setRetakeLoading(true);
    try {
      const [completions, grants] = await Promise.all([
        firestoreService.getCompletionsByQuiz(quizId),
        firestoreService.getRetakeGrantsByQuiz(quizId)
      ]);
      setRetakeData({ completions, grants });
    } finally {
      setRetakeLoading(false);
    }
  };

  const grantRetake = async () => {
    if (!retakeQuizId || !selectedStudentId || grantCount < 1) return;
    try {
      setGranting(true);
  await firestoreService.grantRetake(selectedStudentId, retakeQuizId, grantCount, user?.uid || '-');
      const [completions, grants] = await Promise.all([
        firestoreService.getCompletionsByQuiz(retakeQuizId),
        firestoreService.getRetakeGrantsByQuiz(retakeQuizId)
      ]);
      setRetakeData({ completions, grants });
      setGrantCount(1);
    } catch {
      alert('Gagal memberikan akses ulang');
    } finally {
      setGranting(false);
    }
  };

  const revokeRetake = async (userId: string) => {
    if (!retakeQuizId) return;
    try {
      await firestoreService.revokeRetake(userId, retakeQuizId);
      const [completions, grants] = await Promise.all([
        firestoreService.getCompletionsByQuiz(retakeQuizId),
        firestoreService.getRetakeGrantsByQuiz(retakeQuizId)
      ]);
      setRetakeData({ completions, grants });
    } catch {
      alert('Gagal mencabut akses ulang');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container large">
        <div className="modal-header">
          <h2>Kelola Kuis</h2>
          <button className="close-btn" onClick={onClose} aria-label="Tutup">×</button>
        </div>
        <div className="modal-content">
          {error && <div className="error-message">{error}</div>}
          {loading ? (
            <div className="loading-state"><div className="loading-spinner" /><p>Memuat kuis...</p></div>
          ) : (
            <div className="content-grid" style={{ gridTemplateColumns: '1fr' }}>
              {quizzes.length === 0 && (
                <div className="empty-state">Belum ada kuis dibuat</div>
              )}
              {quizzes.map(q => (
                <div key={q.id} className="content-card">
                  <div className="card-header">
                    <div className="lesson-order">KZ</div>
                    <div className="card-actions">
                      {editingId === q.id ? (
                        <>
                          <button className="btn-action secondary" onClick={() => setEditingId(null)}>
                            Batal
                          </button>
                          <button className="btn-action primary" onClick={saveEdit}>
                            Simpan
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn-action" onClick={() => toggleExpand(q.id)}>
                            {expandedId === q.id ? 'Tutup' : 'Lihat'}
                          </button>
                          <button className="btn-action edit" onClick={() => startEdit(q)}>
                            Edit
                          </button>
                          <button className="btn-action" onClick={() => openRetakeManager(q.id)}>
                            Kelola Akses Ulang
                          </button>
                          <button className="btn-action delete" onClick={() => setConfirmDelete({ id: q.id, title: q.title })}>
                            Hapus
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="card-content">
                    {editingId === q.id ? (
                      <div className="form-row">
                        <div className="form-group" style={{ flex: 2 }}>
                          <label>Judul Kuis</label>
                          <input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
                        </div>
                        <div className="form-group" style={{ maxWidth: 220 }}>
                          <label>Batas Waktu (menit)</label>
                          <input type="number" min={1} value={form.timeLimitMin} onChange={(e) => setForm(f => ({ ...f, timeLimitMin: Math.max(1, parseInt(e.target.value || '1', 10)) }))} />
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4>{q.title}</h4>
                        <p>Bab: {moduleTitle(q.moduleId)}</p>
                        {q.lessonId && <p>Materi: {lessonTitle(q.lessonId)}</p>}
                        <div className="card-meta">
                          <span>Waktu: {Math.floor((q.timeLimitSec ?? 600) / 60)} menit</span>
                        </div>
                        {expandedId === q.id && (
                          <div style={{ marginTop: 12 }}>
                            <h5 style={{ margin: '8px 0' }}>Pertanyaan</h5>
                            {loadingQuestions === q.id && <div style={{ color: '#64748b' }}>Memuat pertanyaan...</div>}
                            {questionMap[q.id] && questionMap[q.id].length === 0 && (
                              <div className="empty-state">Belum ada pertanyaan</div>
                            )}
                            {questionMap[q.id] && questionMap[q.id].length > 0 && (
                              <ul style={{ paddingLeft: 16, margin: 0 }}>
                                {questionMap[q.id].map((ques, idx) => (
                                  <li key={ques.id} style={{ marginBottom: 8 }}>
                                    <div style={{ fontWeight: 600 }}>{idx + 1}. {ques.text}</div>
                                    {['multiple_choice', 'checkboxes', 'dropdown'].includes(ques.type) && (
                                      <div style={{ marginTop: 4, color: '#475569' }}>
                                        {(ques.options || []).map((opt, i) => {
                                          const isCorrect = ques.type === 'checkboxes' ? (ques.correctIndexes || []).includes(i) : (ques.correctIndex ?? -1) === i;
                                          return (
                                            <div key={i}>{isCorrect ? '✓' : '○'} {opt}</div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2>Konfirmasi Hapus</h2>
              <button className="close-btn" onClick={() => setConfirmDelete(null)} aria-label="Tutup">×</button>
            </div>
            <div className="modal-content">
              <p>Hapus kuis "{confirmDelete.title}"? Tindakan ini juga akan menghapus pertanyaan dan jawaban terkait.</p>
              <div className="form-actions">
                <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>Batal</button>
                <button className="btn-primary" onClick={doDelete}>Hapus</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {retakeQuizId && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h2>Kelola Akses Ulang Kuis</h2>
              <button className="close-btn" onClick={() => { setRetakeQuizId(null); setRetakeData(null); }} aria-label="Tutup">×</button>
            </div>
            <div className="modal-content">
              {retakeLoading || !retakeData ? (
                <div className="loading-state"><div className="loading-spinner" /><p>Memuat data...</p></div>
              ) : (
                <>
                  <div className="form-row" style={{ gridTemplateColumns: '2fr 1fr 1fr auto' }}>
                    <div className="form-group">
                      <label>Pilih Siswa</label>
                      <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
                        <option value="">-- pilih siswa --</option>
                        {students.map(s => (
                          <option key={s.id} value={s.id}>{s.name || s.email}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Jumlah Kesempatan</label>
                      <input type="number" min={1} value={grantCount} onChange={(e) => setGrantCount(Math.max(1, parseInt(e.target.value || '1', 10)))} />
                    </div>
                    <div className="form-group" style={{ alignSelf: 'end' }}>
                      <button className="btn-primary" disabled={!selectedStudentId || granting} onClick={grantRetake}>{granting ? 'Menyimpan...' : 'Beri Akses Ulang'}</button>
                    </div>
                  </div>

                  <h5 style={{ marginTop: 8 }}>Status Siswa</h5>
                  <div className="content-grid" style={{ gridTemplateColumns: '1fr' }}>
                    {students.map(s => {
                      const completed = !!retakeData.completions[s.id];
                      const grant = retakeData.grants.find(g => g.userId === s.id);
                      return (
                        <div className="content-card" key={s.id}>
                          <div className="card-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: 600 }}>{s.name || s.email}</div>
                              <div className="card-meta">
                                <span>{completed ? 'Sudah pernah mengerjakan' : 'Belum mengerjakan'}</span>
                                {grant && <span>Akses ulang tersisa: {grant.allowed}</span>}
                              </div>
                            </div>
                            <div className="card-actions">
                              {grant ? (
                                <button className="btn-action delete" onClick={() => revokeRetake(s.id)}>Cabut</button>
                              ) : (
                                <button className="btn-action" onClick={() => { setSelectedStudentId(s.id); setGrantCount(1); }}>Beri 1x</button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageQuizzes;

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { firestoreService } from '../services/firestore';
import type { LessonDoc, ModuleDoc, QuestionDoc, QuestionType, QuizDoc } from '../types';

const CLOUDINARY_CLOUD_NAME = 'dgkh8fleg';
const CLOUDINARY_UPLOAD_PRESET = 'kelazgraphicdesigner';

function withOptimized(url: string): string {
  return url.replace('/upload/', '/upload/f_auto,q_auto,w_1600,c_limit/');
}

async function uploadToCloudinary(file: File): Promise<{ secure_url: string }> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Upload gagal');
  return res.json();
}

const EditQuizPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<(ModuleDoc & { id: string })[]>([]);
  const [lessons, setLessons] = useState<(LessonDoc & { id: string })[]>([]);
  const [quiz, setQuiz] = useState<(QuizDoc & { id: string }) | null>(null);
  const [questions, setQuestions] = useState<(QuestionDoc & { id: string })[]>([]);
  const [form, setForm] = useState<{ moduleId: string; lessonId: string; title: string; timeLimitMin: number }>({ moduleId: '', lessonId: '', title: '', timeLimitMin: 10 });

  useEffect(() => {
    const run = async () => {
      if (!quizId) return;
      setLoading(true);
      try {
        const [mods, qz] = await Promise.all([firestoreService.getModules(), firestoreService.getQuiz(quizId)]);
        setModules(mods);
        if (!qz) { setQuiz(null); return; }
        setQuiz(qz);
        setForm({ moduleId: qz.moduleId || '', lessonId: qz.lessonId || '', title: qz.title, timeLimitMin: Math.max(1, Math.round((qz.timeLimitSec ?? 600)/60)) });
        if (qz.moduleId) {
          const ls = await firestoreService.getLessons(qz.moduleId);
          setLessons(ls);
        }
        const qs = await firestoreService.getQuestions(qz.id);
        setQuestions(qs);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [quizId]);

  useEffect(() => {
    const loadLessons = async () => {
      if (!form.moduleId) { setLessons([]); setForm(f => ({ ...f, lessonId: '' })); return; }
      const ls = await firestoreService.getLessons(form.moduleId);
      setLessons(ls);
      if (!ls.find(l => l.id === form.lessonId)) setForm(f => ({ ...f, lessonId: '' }));
    };
    loadLessons();
  }, [form.moduleId]);

  const saveInfo = async () => {
    if (!quiz) return;
    await firestoreService.updateQuiz(quiz.id, { moduleId: form.moduleId, lessonId: form.lessonId, title: form.title.trim(), timeLimitSec: Math.max(60, form.timeLimitMin*60) });
    alert('Info kuis disimpan');
  };

  const updateQuestion = async (qid: string, data: Partial<QuestionDoc>) => {
    if (!quiz) return;
    await firestoreService.updateQuestion(quiz.id, qid, data);
    setQuestions(prev => prev.map(q => q.id === qid ? { ...q, ...data } as any : q));
  };

  const deleteQuestion = async (qid: string) => {
    if (!quiz) return;
    if (!confirm('Hapus pertanyaan ini?')) return;
    await firestoreService.deleteQuestion(quiz.id, qid);
    setQuestions(prev => prev.filter(q => q.id !== qid));
  };

  if (loading) return <div className="dashboard-main"><div className="container"><div className="loading-state"><div className="loading-spinner"/><p>Memuat...</p></div></div></div>;
  if (!quiz) return <div className="dashboard-main"><div className="container"><div className="card"><div className="card-content"><p>Kuis tidak ditemukan.</p><Link to="/dashboard" className="btn-secondary">Kembali</Link></div></div></div></div>;

  return (
    <div className="dashboard-main">
      <div className="container">
        <div style={{ marginBottom: 8 }}><Link to="/dashboard" className="btn-secondary">← Kembali ke Dashboard</Link></div>
        <div className="card" style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div className="card-content">
            <h1 style={{ marginTop: 0 }}>Edit Kuis</h1>
            <div className="form-card">
              <h4>Informasi Kuis</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Bab</label>
                  <select value={form.moduleId} onChange={e => setForm(f => ({ ...f, moduleId: e.target.value }))}>
                    <option value="">-- Pilih Bab --</option>
                    {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Materi</label>
                  <select value={form.lessonId} onChange={e => setForm(f => ({ ...f, lessonId: e.target.value }))} disabled={!form.moduleId}>
                    <option value="">-- Pilih Materi --</option>
                    {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Judul</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="form-group" style={{ maxWidth: 220 }}>
                  <label>Batas Waktu (menit)</label>
                  <input type="number" min={1} value={form.timeLimitMin} onChange={e => setForm(f => ({ ...f, timeLimitMin: Math.max(1, parseInt(e.target.value || '1', 10)) }))} />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn-primary" onClick={saveInfo}>Simpan Info</button>
              </div>
            </div>

            <div className="form-card">
              <h4>Pertanyaan ({questions.length})</h4>
              {questions.length === 0 ? (
                <div className="empty-state">Belum ada pertanyaan</div>
              ) : (
                <div className="content-grid" style={{ gridTemplateColumns: '1fr' }}>
                  {questions.map((q, idx) => (
                    <div key={q.id} className="content-card">
                      <div className="card-header">
                        <div className="lesson-order">P{idx + 1}</div>
                        <div className="card-actions">
                          <button className="btn-action delete" onClick={() => deleteQuestion(q.id)}>Hapus</button>
                        </div>
                      </div>
                      <div className="card-content">
                        <div className="form-group">
                          <label>Tipe</label>
                          <select value={q.type} onChange={e => updateQuestion(q.id, { type: e.target.value as QuestionType })}>
                            <option value="multiple_choice">Multiple Choice</option>
                            <option value="checkboxes">Checkboxes</option>
                            <option value="dropdown">Dropdown</option>
                            <option value="short_answer">Short Answer</option>
                            <option value="paragraph">Paragraph</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Pertanyaan</label>
                          <textarea value={q.text} rows={3} onChange={e => updateQuestion(q.id, { text: e.target.value })} />
                        </div>
                        <div className="form-row">
                          <div className="form-group" style={{ flex: 2 }}>
                            <label>Gambar (opsional)</label>
                            <input value={q.imageUrl || ''} onChange={e => updateQuestion(q.id, { imageUrl: e.target.value })} />
                            <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                              <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const out = await uploadToCloudinary(f); const optimized = withOptimized(out.secure_url); updateQuestion(q.id, { imageUrl: optimized }); }} />
                            </div>
                          </div>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label>Alt text</label>
                            <input value={q.imageAlt || ''} onChange={e => updateQuestion(q.id, { imageAlt: e.target.value })} />
                          </div>
                        </div>

                        {['multiple_choice', 'checkboxes', 'dropdown'].includes(q.type) && (
                          <div className="form-group">
                            <label>Pilihan</label>
                            {(q.options || []).map((opt, i) => (
                              <div key={i} className="option-row">
                                {q.type === 'checkboxes' ? (
                                  <input type="checkbox" checked={(q.correctIndexes || []).includes(i)} onChange={(e) => {
                                    const set = new Set(q.correctIndexes || []);
                                    e.target.checked ? set.add(i) : set.delete(i);
                                    const sorted = Array.from(set).sort((a,b)=>a-b);
                                    updateQuestion(q.id, { correctIndexes: sorted });
                                  }} />
                                ) : (
                                  <input type="radio" name={`correct_${q.id}`} checked={(q.correctIndex ?? 0) === i} onChange={() => updateQuestion(q.id, { correctIndex: i })} />
                                )}
                                <input type="text" className="option-input" value={opt} onChange={e => {
                                  const opts = [...(q.options || [])];
                                  opts[i] = e.target.value;
                                  updateQuestion(q.id, { options: opts });
                                }} />
                                <button type="button" className="btn-delete" onClick={() => {
                                  const opts = (q.options || []).filter((_, idx2) => idx2 !== i);
                                  const patch: Partial<QuestionDoc> = { options: opts };
                                  if (q.type !== 'checkboxes') {
                                    if ((q.correctIndex ?? 0) >= opts.length) patch.correctIndex = 0;
                                  } else {
                                    patch.correctIndexes = (q.correctIndexes || []).filter(x => x !== i).map(x => (x > i ? x-1 : x));
                                  }
                                  updateQuestion(q.id, patch);
                                }}>Hapus</button>
                              </div>
                            ))}
                            <div className="form-actions" style={{ marginTop: 8 }}>
                              <button type="button" className="btn-secondary" onClick={() => updateQuestion(q.id, { options: [...(q.options || []), ''] })}>+ Tambah Pilihan</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditQuizPage;

import React, { useEffect, useState } from 'react';
import { firestoreService } from '../services/firestore';
import type { LessonDoc, ModuleDoc, QuestionDoc, QuestionType } from '../types';

interface CreateQuizProps {
  onClose: () => void;
}

export const CreateQuiz: React.FC<CreateQuizProps> = ({ onClose }) => {
  const [modules, setModules] = useState<(ModuleDoc & { id: string })[]>([]);
  const [lessons, setLessons] = useState<(LessonDoc & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'quiz-info' | 'questions'>('quiz-info');

  const [quizForm, setQuizForm] = useState({
    moduleId: '',
    lessonId: '',
    title: '',
    timeLimitSec: 600,
  });

  const [questions, setQuestions] = useState<Omit<QuestionDoc, 'order'>[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Omit<QuestionDoc, 'order'>>({
    type: 'multiple_choice',
    text: '',
    options: ['', '', ''],
    correctIndex: 0,
    correctIndexes: [],
  });

  useEffect(() => {
    const loadModules = async () => {
      try {
        setLoading(true);
        const data = await firestoreService.getModules();
        setModules(data);
      } catch (e) {
        console.error('Error loading modules:', e);
      } finally {
        setLoading(false);
      }
    };
    loadModules();
  }, []);

  // Load lessons when a module is selected
  useEffect(() => {
    const loadLessons = async () => {
      if (!quizForm.moduleId) {
        setLessons([]);
        setQuizForm((q) => ({ ...q, lessonId: '' }));
        return;
      }
      try {
        setLoading(true);
        const ls = await firestoreService.getLessons(quizForm.moduleId);
        setLessons(ls);
        if (!ls.find((l) => l.id === quizForm.lessonId)) {
          setQuizForm((q) => ({ ...q, lessonId: '' }));
        }
      } catch (e) {
        console.error('Error loading lessons:', e);
      } finally {
        setLoading(false);
      }
    };
    loadLessons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizForm.moduleId]);

  const handleQuizInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizForm.moduleId || !quizForm.lessonId || !quizForm.title) {
      alert('Mohon lengkapi semua kolom yang diperlukan');
      return;
    }
    setStep('questions');
  };

  const updateQuestionOption = (index: number, value: string) => {
    const opts = currentQuestion.options ? [...currentQuestion.options] : [];
    opts[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: opts });
  };

  const addOption = () => {
    const opts = currentQuestion.options ? [...currentQuestion.options] : [];
    opts.push('');
    setCurrentQuestion({ ...currentQuestion, options: opts });
  };

  const removeOption = (index: number) => {
    const opts = (currentQuestion.options || []).filter((_, i) => i !== index);
    const next: any = { ...currentQuestion, options: opts };
    if (currentQuestion.type !== 'checkboxes') {
      if ((currentQuestion.correctIndex ?? 0) >= opts.length) next.correctIndex = 0;
    } else {
      next.correctIndexes = (currentQuestion.correctIndexes || [])
        .filter((i) => i !== index)
        .map((i) => (i > index ? i - 1 : i));
    }
    setCurrentQuestion(next);
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.text.trim()) {
      alert('Mohon isi teks pertanyaan');
      return;
    }
    if (['multiple_choice', 'checkboxes', 'dropdown'].includes(currentQuestion.type)) {
      const opts = currentQuestion.options || [];
      if (opts.length < 2 || opts.some((o) => !o.trim())) {
        alert('Minimal 2 pilihan dan tidak boleh kosong');
        return;
      }
      if (currentQuestion.type !== 'checkboxes' && (currentQuestion.correctIndex ?? -1) < 0) {
        alert('Pilih jawaban benar');
        return;
      }
      if (currentQuestion.type === 'checkboxes' && (!currentQuestion.correctIndexes || currentQuestion.correctIndexes.length === 0)) {
        alert('Pilih minimal satu jawaban benar');
        return;
      }
    }

    setQuestions([...questions, { ...currentQuestion }]);
    setCurrentQuestion({
      type: 'multiple_choice',
      text: '',
      options: ['', '', ''],
      correctIndex: 0,
      correctIndexes: [],
    });
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleCreateQuiz = async () => {
    if (questions.length === 0) {
      alert('Mohon tambahkan minimal satu pertanyaan');
      return;
    }
    try {
      setLoading(true);
      const quizId = await firestoreService.createQuiz({
        moduleId: quizForm.moduleId,
        lessonId: quizForm.lessonId,
        title: quizForm.title,
        createdBy: 'current-user',
        timeLimitSec: quizForm.timeLimitSec,
      });
      for (const q of questions) {
        await firestoreService.addQuestionToQuiz(quizId, q);
      }
      alert('Kuis berhasil dibuat!');
      onClose();
    } catch (e) {
      console.error('Error creating quiz:', e);
      alert('Gagal membuat kuis. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-content">Memuat...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container large">
        <div className="modal-header">
          <h2>Buat Kuis</h2>
          <button className="close-btn" onClick={onClose} aria-label="Tutup">×</button>
        </div>
        <div className="modal-content">
          <div className="tabs">
            <button className={`tab ${step === 'quiz-info' ? 'active' : ''}`} onClick={() => setStep('quiz-info')}>Info Kuis</button>
            <button
              className={`tab ${step === 'questions' ? 'active' : ''}`}
              onClick={() => setStep('questions')}
              disabled={!quizForm.moduleId || !quizForm.lessonId || !quizForm.title}
            >
              Pertanyaan
            </button>
          </div>

          {step === 'quiz-info' && (
            <form onSubmit={handleQuizInfoSubmit}>
              <div className="form-card">
                <h4>Informasi Kuis</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Pilih Bab *</label>
                    <select
                      value={quizForm.moduleId}
                      onChange={(e) => setQuizForm({ ...quizForm, moduleId: e.target.value })}
                    >
                      <option value="">-- Pilih Bab --</option>
                      {modules.map((m) => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Pilih Materi *</label>
                    <select
                      value={quizForm.lessonId}
                      onChange={(e) => setQuizForm({ ...quizForm, lessonId: e.target.value })}
                      disabled={!quizForm.moduleId}
                    >
                      <option value="">-- Pilih Materi --</option>
                      {lessons.map((l) => (
                        <option key={l.id} value={l.id}>{l.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>Judul Kuis *</label>
                    <input
                      type="text"
                      value={quizForm.title}
                      onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                      placeholder="Contoh: Kuis Bab 1 - Desain Dasar"
                    />
                  </div>
                  <div className="form-group" style={{ maxWidth: '220px' }}>
                    <label>Batas Waktu (menit)</label>
                    <input
                      type="number"
                      min={1}
                      value={Math.max(1, Math.round(quizForm.timeLimitSec / 60))}
                      onChange={(e) => {
                        const minutes = Math.max(1, parseInt(e.target.value || '1', 10));
                        setQuizForm({ ...quizForm, timeLimitSec: minutes * 60 });
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
                <button type="submit" className="btn-primary">Lanjut ke Pertanyaan</button>
              </div>
            </form>
          )}

          {step === 'questions' && (
            <div>
              <div className="form-card">
                <h4>Ringkasan</h4>
                <div className="card-meta" style={{ gap: '24px' }}>
                  <span>Bab: {modules.find((m) => m.id === quizForm.moduleId)?.title}</span>
                  <span>Materi: {lessons.find((l) => l.id === quizForm.lessonId)?.title || '-'}</span>
                  <span>Batas Waktu: {Math.floor(quizForm.timeLimitSec / 60)} menit</span>
                </div>
              </div>

              <div className="form-card">
                <h4>Tambah Pertanyaan Baru</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Tipe Pertanyaan</label>
                    <select
                      value={currentQuestion.type}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, type: e.target.value as QuestionType })}
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="checkboxes">Checkboxes</option>
                      <option value="dropdown">Dropdown</option>
                      <option value="short_answer">Short Answer</option>
                      <option value="paragraph">Paragraph</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Pertanyaan *</label>
                  <textarea
                    value={currentQuestion.text}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                    rows={3}
                    placeholder="Masukkan pertanyaan Anda"
                  />
                </div>

                {['multiple_choice', 'checkboxes', 'dropdown'].includes(currentQuestion.type) && (
                  <div className="form-group">
                    <label>Pilihan</label>
                    {(currentQuestion.options || []).map((option, index) => (
                      <div key={index} className="option-row">
                        {currentQuestion.type === 'checkboxes' ? (
                          <input
                            type="checkbox"
                            checked={(currentQuestion.correctIndexes || []).includes(index)}
                            onChange={(e) => {
                              const set = new Set(currentQuestion.correctIndexes || []);
                              e.target.checked ? set.add(index) : set.delete(index);
                              setCurrentQuestion({ ...currentQuestion, correctIndexes: Array.from(set).sort((a, b) => a - b) });
                            }}
                          />
                        ) : (
                          <input
                            type="radio"
                            name="correct"
                            checked={(currentQuestion.correctIndex ?? 0) === index}
                            onChange={() => setCurrentQuestion({ ...currentQuestion, correctIndex: index })}
                          />
                        )}
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateQuestionOption(index, e.target.value)}
                          placeholder={`Pilihan ${index + 1}`}
                          className="option-input"
                        />
                        <button type="button" className="btn-delete" onClick={() => removeOption(index)} title="Hapus pilihan">
                          <span>Hapus</span>
                        </button>
                      </div>
                    ))}
                    <div className="form-actions" style={{ marginTop: '8px' }}>
                      <button type="button" className="btn-secondary" onClick={addOption}>
                        + Tambah Pilihan
                      </button>
                    </div>
                  </div>
                )}

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setStep('quiz-info')}>Kembali</button>
                  <button type="button" className="btn-primary" onClick={handleAddQuestion}>Tambahkan ke Daftar</button>
                </div>
              </div>

              <div className="form-card">
                <h4>Pertanyaan ({questions.length})</h4>
                {questions.length === 0 ? (
                  <div className="empty-state" style={{ padding: '20px' }}>Belum ada pertanyaan ditambahkan</div>
                ) : (
                  <div className="content-grid" style={{ gridTemplateColumns: '1fr' }}>
                    {questions.map((q, index) => (
                      <div key={index} className="content-card">
                        <div className="card-header">
                          <div className="lesson-order">P{index + 1}</div>
                          <div className="card-actions">
                            <button className="btn-action delete" onClick={() => handleRemoveQuestion(index)}>
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                        <div className="card-content">
                          <h4>
                            {q.type === 'multiple_choice' ? 'Multiple Choice' : q.type === 'checkboxes' ? 'Checkboxes' : q.type === 'dropdown' ? 'Dropdown' : q.type === 'short_answer' ? 'Short Answer' : 'Paragraph'}
                          </h4>
                          <p>{q.text}</p>
                          {['multiple_choice', 'checkboxes', 'dropdown'].includes(q.type) && (
                            <div className="card-meta" style={{ display: 'block', color: '#475569' }}>
                              {(q.options || []).map((opt, i) => {
                                const isCorrect = q.type === 'checkboxes' ? (q.correctIndexes || []).includes(i) : (q.correctIndex ?? -1) === i;
                                return (
                                  <div key={i} style={{ marginBottom: '4px' }}>
                                    {isCorrect ? '✓' : '○'} {opt}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="form-actions">
                  <button className="btn-primary" onClick={handleCreateQuiz} disabled={questions.length === 0}>Buat Kuis</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

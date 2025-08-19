import React, { useState, useEffect } from 'react';
import { firestoreService } from '../services/firestore';
import type { ModuleDoc, LessonDoc } from '../types';

interface ManageContentProps {
  onClose: () => void;
}

export const ManageContent: React.FC<ManageContentProps> = ({ onClose }) => {
  const [modules, setModules] = useState<(ModuleDoc & { id: string })[]>([]);
  const [lessons, setLessons] = useState<(LessonDoc & { id: string })[]>([]);
  const [activeTab, setActiveTab] = useState<'modules' | 'lessons'>('modules');
  const [loading, setLoading] = useState(true);
  const [showAddModule, setShowAddModule] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [editingModuleId, setEditingModuleId] = useState<string>('');
  const [editingLessonId, setEditingLessonId] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'module' | 'lesson'; id: string } | null>(null);

  // Form states
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
  order: 1,
  visible: true
  });

  const [lessonForm, setLessonForm] = useState({
    title: '',
    content: '',
    order: 1
  });

  const [moduleEditForm, setModuleEditForm] = useState({
    title: '',
    description: '',
  order: 1,
  visible: true
  });
  const [lessonEditForm, setLessonEditForm] = useState({
    title: '',
    content: '',
    order: 1
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const modulesData = await firestoreService.getModules();
      setModules(modulesData);
      if (selectedModuleId) {
        const lessonsData = await firestoreService.getLessons(selectedModuleId);
        setLessons(lessonsData);
      } else {
        setLessons([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // When module selection changes, reload its lessons
  useEffect(() => {
    if (!loading) {
      (async () => {
        if (selectedModuleId) {
          const lessonsData = await firestoreService.getLessons(selectedModuleId);
          setLessons(lessonsData);
        } else {
          setLessons([]);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModuleId]);

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await firestoreService.createModule({
        title: moduleForm.title,
        description: moduleForm.description,
        createdBy: 'current-user', // TODO: get from auth context
        order: moduleForm.order,
        visible: moduleForm.visible
      });
      setModuleForm({ title: '', description: '', order: 1, visible: true });
      setShowAddModule(false);
      loadData();
    } catch (error) {
      console.error('Error creating module:', error);
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModuleId) {
      alert('Pilih bab terlebih dahulu');
      return;
    }
    try {
      await firestoreService.createLesson(selectedModuleId, {
        title: lessonForm.title,
        content: lessonForm.content,
        order: lessonForm.order
      });
      setLessonForm({ title: '', content: '', order: 1 });
      setShowAddLesson(false);
      loadData();
    } catch (error) {
      console.error('Error creating lesson:', error);
    }
  };

  const startEditModule = (m: ModuleDoc & { id: string }) => {
    setEditingModuleId(m.id);
  setModuleEditForm({ title: m.title, description: m.description ?? '', order: m.order || 1, visible: m.visible ?? true });
  };

  const saveEditModule = async () => {
    try {
      await firestoreService.updateModule(editingModuleId, {
        title: moduleEditForm.title,
        description: moduleEditForm.description,
        order: moduleEditForm.order,
        visible: moduleEditForm.visible
      });
      setEditingModuleId('');
      await loadData();
    } catch (e) {
      console.error('Error updating module:', e);
    }
  };

  const confirmDeleteModule = (id: string) => setConfirmDelete({ type: 'module', id });
  const confirmDeleteLesson = (id: string) => setConfirmDelete({ type: 'lesson', id });

  const performDelete = async () => {
    if (!confirmDelete) return;
    try {
      if (confirmDelete.type === 'module') {
        await firestoreService.deleteModule(confirmDelete.id);
        if (selectedModuleId === confirmDelete.id) setSelectedModuleId('');
      } else if (confirmDelete.type === 'lesson' && selectedModuleId) {
        await firestoreService.deleteLesson(selectedModuleId, confirmDelete.id);
      }
      setConfirmDelete(null);
      await loadData();
    } catch (e) {
      console.error('Error deleting:', e);
    }
  };

  const startEditLesson = (l: LessonDoc & { id: string }) => {
    setEditingLessonId(l.id);
    setLessonEditForm({ title: l.title, content: l.content ?? '', order: l.order || 1 });
  };

  const saveEditLesson = async () => {
    if (!selectedModuleId) return;
    try {
      await firestoreService.updateLesson(selectedModuleId, editingLessonId, {
        title: lessonEditForm.title,
        content: lessonEditForm.content,
        order: lessonEditForm.order
      });
      setEditingLessonId('');
      await loadData();
    } catch (e) {
      console.error('Error updating lesson:', e);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading content...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container large">
        {/* Header */}
        <div className="modal-header">
          <h2>
            <i className="fas fa-cogs"></i>
            Manage Content
          </h2>
          <button className="close-btn" onClick={onClose} title="Tutup" aria-label="Tutup">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6l-12 12"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'modules' ? 'active' : ''}`}
              onClick={() => setActiveTab('modules')}
            >
              <i className="fas fa-th-large"></i>
              Bab ({modules.length})
            </button>
            <button
              className={`tab ${activeTab === 'lessons' ? 'active' : ''}`}
              onClick={() => setActiveTab('lessons')}
            >
              <i className="fas fa-book-open"></i>
              Materi {selectedModuleId ? `(Bab terpilih)` : ''}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="modal-content">
          {/* Modules Tab */}
          {activeTab === 'modules' && (
            <div className="tab-content">
              <div className="content-header">
                <h3>Bab Pembelajaran</h3>
                <button
                  className="btn-primary"
                  onClick={() => setShowAddModule(true)}
                >
                  <i className="fas fa-plus"></i>
                  Tambah Bab
                </button>
              </div>

              {showAddModule && (
                <div className="form-card">
                  <form onSubmit={handleAddModule}>
                    <h4>
                      <i className="fas fa-plus-circle"></i>
                      Buat Bab Baru
                    </h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Judul Bab *</label>
                        <input
                          type="text"
                          value={moduleForm.title}
                          onChange={(e) => setModuleForm({...moduleForm, title: e.target.value})}
                          placeholder="Contoh: Design Fundamental"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Urutan</label>
                        <input
                          type="number"
                          value={moduleForm.order}
                          onChange={(e) => setModuleForm({...moduleForm, order: parseInt(e.target.value)})}
                          min="1"
                          required
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Deskripsi Bab *</label>
                      <textarea
                        value={moduleForm.description}
                        onChange={(e) => setModuleForm({...moduleForm, description: e.target.value})}
                        placeholder="Jelaskan apa yang akan dipelajari siswa dalam bab ini"
                        rows={3}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Tampilkan ke siswa</label>
                      <select value={moduleForm.visible ? '1' : '0'} onChange={(e)=>setModuleForm({...moduleForm, visible: e.target.value==='1'})}>
                        <option value="1">Ya</option>
                        <option value="0">Tidak</option>
                      </select>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-primary">
                        <i className="fas fa-save"></i>
                        Buat Bab
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setShowAddModule(false)}
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="content-grid">
                {modules.length === 0 ? (
                  <div className="empty-state">
                    <i className="fas fa-th-large"></i>
                    <h4>Belum ada bab yang dibuat</h4>
                    <p>Buat bab pertama untuk mulai mengorganisir konten pembelajaran.</p>
                  </div>
                ) : (
                  modules.map((module) => (
                    <div key={module.id} className="content-card">
                      <div className="card-header">
                        <div className="module-order">Bab #{module.order}</div>
                        <div className="card-actions">
                          <button
                            className={`btn-action ${selectedModuleId === module.id ? 'secondary' : 'primary'}`}
                            title={selectedModuleId === module.id ? 'Bab terpilih' : 'Pilih bab untuk dikelola'}
                            onClick={() => setSelectedModuleId(module.id)}
                          >
                            <i className="fas fa-check"></i>
                            <span>{selectedModuleId === module.id ? 'Dipilih' : 'Pilih Bab'}</span>
                          </button>
                          <button className="btn-action edit" onClick={() => startEditModule(module)} title="Edit bab">
                            <i className="fas fa-edit"></i>
                            <span>Edit</span>
                          </button>
                          <button className="btn-action delete" onClick={() => confirmDeleteModule(module.id)} title="Hapus bab">
                            <i className="fas fa-trash"></i>
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                      <div className="card-content">
                        {editingModuleId === module.id ? (
                          <div className="form-inline">
                            <div className="form-group">
                              <label>Judul</label>
                              <input value={moduleEditForm.title} onChange={e=>setModuleEditForm({...moduleEditForm,title:e.target.value})} />
                            </div>
                            <div className="form-group">
                              <label>Deskripsi</label>
                              <textarea rows={2} value={moduleEditForm.description} onChange={e=>setModuleEditForm({...moduleEditForm,description:e.target.value})} />
                            </div>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Urutan</label>
                                <input type="number" min={1} value={moduleEditForm.order} onChange={e=>setModuleEditForm({...moduleEditForm,order:parseInt(e.target.value)})} />
                              </div>
                              <div className="form-group">
                                <label>Tampilkan ke siswa</label>
                                <select value={(moduleEditForm.visible ? '1' : '0')} onChange={(e)=>setModuleEditForm({...moduleEditForm, visible: e.target.value==='1'})}>
                                  <option value="1">Ya</option>
                                  <option value="0">Tidak</option>
                                </select>
                              </div>
                              <div className="form-actions small">
                                <button className="btn-primary" onClick={saveEditModule}>Simpan</button>
                                <button className="btn-secondary" onClick={()=>setEditingModuleId('')}>Batal</button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h4>{module.title}</h4>
                            <p>{module.description}</p>
                            {selectedModuleId === module.id && (
                              <div className="selected-badge">Dipilih untuk dikelola</div>
                            )}
                          </>
                        )}
                        <div className="card-meta">
                          <span><i className="fas fa-calendar"></i> Dibuat: {new Date().toLocaleDateString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Lessons Tab: Module-first management */}
          {activeTab === 'lessons' && (
            <div className="tab-content">
              <div className="content-header">
                <h3>Materi Pembelajaran</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Pilih Bab untuk dikelola</label>
                    <select value={selectedModuleId} onChange={e=>setSelectedModuleId(e.target.value)}>
                      <option value="">-- Pilih Bab --</option>
                      {modules.map(m => (
                        <option key={m.id} value={m.id}>Bab {m.order}: {m.title}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={() => setShowAddLesson(true)}
                    disabled={!selectedModuleId}
                    title={!selectedModuleId ? 'Pilih bab dahulu' : 'Tambah materi'}
                  >
                    <i className="fas fa-plus"></i>
                    Tambah Materi
                  </button>
                </div>
              </div>

              {!selectedModuleId && (
                <div className="empty-state">
                  <i className="fas fa-layer-group"></i>
                  <h4>Pilih Bab</h4>
                  <p>Silakan pilih bab terlebih dahulu untuk melihat dan mengelola materi.</p>
                </div>
              )}

              {showAddLesson && (
                <div className="form-card">
                  <form onSubmit={handleAddLesson}>
                    <h4>
                      <i className="fas fa-plus-circle"></i>
                      Buat Materi Baru
                    </h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Bab *</label>
                        <input value={modules.find(m=>m.id===selectedModuleId)?.title || ''} disabled />
                      </div>
                      <div className="form-group">
                        <label>Urutan</label>
                        <input
                          type="number"
                          value={lessonForm.order}
                          onChange={(e) => setLessonForm({...lessonForm, order: parseInt(e.target.value)})}
                          min="1"
                          required
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Judul Materi *</label>
                      <input
                        type="text"
                        value={lessonForm.title}
                        onChange={(e) => setLessonForm({...lessonForm, title: e.target.value})}
                        placeholder="Contoh: Pengertian Desain Grafis"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Konten Materi *</label>
                      <textarea
                        value={lessonForm.content}
                        onChange={(e) => setLessonForm({...lessonForm, content: e.target.value})}
                        placeholder="Tulis konten pembelajaran untuk materi ini"
                        rows={4}
                        required
                      />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-primary">
                        <i className="fas fa-save"></i>
                        Buat Materi
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setShowAddLesson(false)}
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="content-grid">
                {selectedModuleId && lessons.length === 0 ? (
                  <div className="empty-state">
                    <i className="fas fa-book-open"></i>
                    <h4>Belum ada materi yang dibuat</h4>
                    <p>Buat materi pertama untuk mulai menambahkan konten pembelajaran.</p>
                  </div>
                ) : (
                  lessons.map((lesson) => (
                    <div key={lesson.id} className="content-card">
                      <div className="card-header">
                        <div className="lesson-order">Materi #{lesson.order}</div>
                        <div className="card-actions">
                          <button className="btn-action edit" onClick={()=>startEditLesson(lesson)} title="Edit materi">
                            <i className="fas fa-edit"></i>
                            <span>Edit</span>
                          </button>
                          <button className="btn-action delete" onClick={()=>confirmDeleteLesson(lesson.id)} title="Hapus materi">
                            <i className="fas fa-trash"></i>
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                      <div className="card-content">
                        {editingLessonId === lesson.id ? (
                          <div className="form-inline">
                            <div className="form-group">
                              <label>Judul Materi</label>
                              <input value={lessonEditForm.title} onChange={e=>setLessonEditForm({...lessonEditForm,title:e.target.value})} />
                            </div>
                            <div className="form-group">
                              <label>Konten</label>
                              <textarea rows={3} value={lessonEditForm.content} onChange={e=>setLessonEditForm({...lessonEditForm,content:e.target.value})} />
                            </div>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Urutan</label>
                                <input type="number" min={1} value={lessonEditForm.order} onChange={e=>setLessonEditForm({...lessonEditForm,order:parseInt(e.target.value)})} />
                              </div>
                              <div className="form-actions small">
                                <button className="btn-primary" onClick={saveEditLesson}>Simpan</button>
                                <button className="btn-secondary" onClick={()=>setEditingLessonId('')}>Batal</button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h4>{lesson.title}</h4>
                            <p>{lesson.content ? lesson.content.substring(0, 100) + '...' : 'Belum ada konten'}</p>
                          </>
                        )}
                        <div className="card-meta">
                          <span><i className="fas fa-clock"></i> Durasi: 30 menit</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {confirmDelete && (
          <div className="modal-overlay confirm">
            <div className="modal-container small">
              <div className="modal-header">
                <h2>
                  <i className="fas fa-exclamation-triangle"></i>
                  Konfirmasi Hapus
                </h2>
                <button className="close-btn" onClick={()=>setConfirmDelete(null)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-content">
                <p>
                  {confirmDelete.type === 'module' 
                    ? 'Menghapus bab juga akan menghapus semua materi di dalamnya. Lanjutkan?' 
                    : 'Anda yakin ingin menghapus materi ini?'}
                </p>
                <div className="form-actions">
                  <button className="btn-secondary" onClick={()=>setConfirmDelete(null)}>Batal</button>
                  <button className="btn-danger" onClick={performDelete}>Hapus</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

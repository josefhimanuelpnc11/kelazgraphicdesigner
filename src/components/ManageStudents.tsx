import React, { useEffect, useState } from 'react';
import { firestoreService } from '../services/firestore';
import type { UserDoc, UserRole } from '../types';

interface ManageStudentsProps {
  onClose: () => void;
}

export const ManageStudents: React.FC<ManageStudentsProps> = ({ onClose }) => {
  const [students, setStudents] = useState<(UserDoc & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; role: UserRole }>({ name: '', role: 'student' });
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const items = await firestoreService.getStudents();
      setStudents(items);
      setError(null);
    } catch (e) {
      setError('Gagal memuat daftar siswa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startEdit = (s: UserDoc & { id: string }) => {
    setEditingId(s.id);
    setForm({ name: s.name, role: s.role });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const payload: Partial<UserDoc> = { name: form.name.trim(), role: form.role };
      await firestoreService.updateUser(editingId, payload);
      setEditingId(null);
      await load();
    } catch (e) {
      alert('Gagal menyimpan perubahan siswa');
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      await firestoreService.deleteUser(confirmDelete.id);
      setConfirmDelete(null);
      await load();
    } catch (e) {
      alert('Gagal menghapus siswa');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container large">
        <div className="modal-header">
          <h2>Kelola Siswa</h2>
          <button className="close-btn" onClick={onClose} aria-label="Tutup">×</button>
        </div>
        <div className="modal-content">
          {error && <div className="error-message">{error}</div>}
          {loading ? (
            <div className="loading-state"><div className="loading-spinner" /><p>Memuat siswa...</p></div>
          ) : (
            <div className="content-grid" style={{ gridTemplateColumns: '1fr' }}>
              {students.length === 0 && (
                <div className="empty-state">Belum ada siswa terdaftar</div>
              )}
              {students.map(s => (
                <div key={s.id} className="content-card">
                  <div className="card-header">
                    <div className="module-order">S</div>
                    <div className="card-actions">
                      {editingId === s.id ? (
                        <>
                          <button className="btn-action secondary" onClick={() => setEditingId(null)}>Batal</button>
                          <button className="btn-action primary" onClick={saveEdit}>Simpan</button>
                        </>
                      ) : (
                        <>
                          <button className="btn-action edit" onClick={() => startEdit(s)}>Edit</button>
                          <button className="btn-action delete" onClick={() => setConfirmDelete({ id: s.id, name: s.name })}>Hapus</button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="card-content">
                    {editingId === s.id ? (
                      <div className="form-row" style={{ gridTemplateColumns: '2fr 1fr' }}>
                        <div className="form-group">
                          <label>Nama</label>
                          <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label>Role</label>
                          <select value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value as UserRole }))}>
                            <option value="student">Siswa</option>
                            <option value="teacher">Guru</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4>{s.name}</h4>
                        <p>Email: {s.email || '-'}</p>
                        <div className="card-meta">
                          <span>Role: {s.role === 'teacher' ? 'Guru' : 'Siswa'}</span>
                          <span>Dibuat: {/* Timestamp display intentionally simple */}</span>
                        </div>
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
              <p>Hapus siswa "{confirmDelete.name}"? Ini hanya menghapus data di aplikasi, bukan akun login.</p>
              <div className="form-actions">
                <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>Batal</button>
                <button className="btn-primary" onClick={doDelete}>Hapus</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStudents;

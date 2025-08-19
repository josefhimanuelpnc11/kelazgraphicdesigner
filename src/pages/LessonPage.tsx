import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { firestoreService } from '../services/firestore';
import type { LessonDoc, ModuleDoc } from '../types';
import '../components/Dashboard.css';

type ModuleWithLessons = (ModuleDoc & { id: string; lessons: (LessonDoc & { id: string })[] });

const LessonPage: React.FC = () => {
  const { moduleId, lessonId } = useParams<{ moduleId: string; lessonId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ModuleWithLessons | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!moduleId) return;
      setLoading(true);
      setError(null);
      try {
        const mod = await firestoreService.getModuleWithLessons(moduleId);
        setData(mod);
      } catch (e: any) {
        setError(e?.message || 'Gagal memuat materi');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [moduleId]);

  const indexInfo = useMemo(() => {
    if (!data || !lessonId) return null;
    const idx = data.lessons.findIndex(l => l.id === lessonId);
    if (idx === -1) return null;
    const current = data.lessons[idx];
    const prev = idx > 0 ? data.lessons[idx - 1] : null;
    const next = idx < data.lessons.length - 1 ? data.lessons[idx + 1] : null;
    return { idx, current, prev, next };
  }, [data, lessonId]);

  if (loading) {
    return (
      <div className="dashboard-main">
        <div className="container">
          <div className="loading-state"><div className="loading-spinner" /><p>Memuat materi...</p></div>
        </div>
      </div>
    );
  }

  if (error || !data || !indexInfo) {
    return (
      <div className="dashboard-main">
        <div className="container">
          {error ? <div className="error-message">{error}</div> : <div className="card"><p>Materi tidak ditemukan.</p></div>}
          <Link className="btn-secondary" to="/belajar" style={{ display: 'inline-block', marginTop: 12 }}>Kembali ke Belajar</Link>
        </div>
      </div>
    );
  }

  const { current, prev, next } = indexInfo;

  return (
    <div className="dashboard-main">
      <div className="container">
        <div className="card" style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: 8 }}>
            <Link to="/belajar" className="btn-secondary" style={{ display: 'inline-block' }}>← Kembali ke Bab</Link>
          </div>
          <h3 style={{ marginBottom: 8 }}>{data.title}</h3>
          <h1 style={{ marginTop: 0 }}>{current.title}</h1>
          <div style={{ marginTop: 12, lineHeight: 1.7, color: '#334155', whiteSpace: 'pre-wrap' }}>
            {current.content || 'Belum ada konten.'}
          </div>
          <div className="form-actions" style={{ justifyContent: 'space-between', marginTop: 24 }}>
            <button className="btn-secondary" disabled={!prev} onClick={() => prev && navigate(`/belajar/m/${data.id}/lesson/${prev.id}`)}>
              ← Sebelumnya
            </button>
            <button className="btn-primary" disabled={!next} onClick={() => next && navigate(`/belajar/m/${data.id}/lesson/${next.id}`)}>
              Lanjutkan →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPage;

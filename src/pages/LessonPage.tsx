import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { firestoreService } from '../services/firestore';
import { useAuth } from '../hooks/useAuth';
import type { LessonDoc, ModuleDoc } from '../types';
import '../components/Dashboard.css';
import PDFViewer from '../components/PDFViewer';

type ModuleWithLessons = (ModuleDoc & { id: string; lessons: (LessonDoc & { id: string })[] });

const LessonPage: React.FC = () => {
  const { moduleId, lessonId } = useParams<{ moduleId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user, userDoc } = useAuth() as any;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ModuleWithLessons | null>(null);
  const closedRef = useRef(false);

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

  // Mark as read only if the student stays on the page for > 10 seconds
  const markedRef = useRef(false);
  useEffect(() => {
    if (!user || !moduleId || !lessonId) return;
    markedRef.current = false;
    const timer = window.setTimeout(async () => {
      if (markedRef.current) return;
      try {
        await firestoreService.markLessonRead(user.uid, moduleId, lessonId);
        markedRef.current = true;
      } catch (e) {
        // swallow; optional retry could be added
      }
    }, 10000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [user, moduleId, lessonId]);

  // Anti-cheat: close lesson if the user switches tabs or window loses focus
  useEffect(() => {
    const closeLesson = () => {
      if (closedRef.current) return;
      closedRef.current = true;
      navigate('/belajar', { replace: true });
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        closeLesson();
      }
    };
    const onBlur = () => {
      closeLesson();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
    };
  }, [navigate]);

  const indexInfo = useMemo(() => {
    if (!data || !lessonId) return null;
    const idx = data.lessons.findIndex(l => l.id === lessonId);
    if (idx === -1) return null;
    const current = data.lessons[idx];
    const prev = idx > 0 ? data.lessons[idx - 1] : null;
    const next = idx < data.lessons.length - 1 ? data.lessons[idx + 1] : null;
    return { idx, current, prev, next };
  }, [data, lessonId]);

  // Compute attachment URL and normalized preview URL BEFORE any early returns
  const attachmentUrlEarly = (indexInfo?.current?.assets && indexInfo.current.assets[0]) || '';
  const normalizedPdfUrl = useMemo(() => {
    if (!attachmentUrlEarly) return '';
    const raw = attachmentUrlEarly.trim();
    if (/drive\.google\.com/.test(raw)) {
      const m1 = raw.match(/drive\.google\.com\/file\/d\/([^/]+)/);
      if (m1 && m1[1]) return `https://drive.google.com/file/d/${m1[1]}/preview`;
      const m2 = raw.match(/[?&]id=([^&]+)/);
      if (m2 && m2[1]) return `https://drive.google.com/file/d/${decodeURIComponent(m2[1])}/preview`;
      const m3 = raw.match(/uc\?id=([^&]+)/);
      if (m3 && m3[1]) return `https://drive.google.com/file/d/${decodeURIComponent(m3[1])}/preview`;
      return raw.replace('/view', '/preview');
    }
    return raw;
  }, [attachmentUrlEarly]);

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

  // If lesson is not visible and user is a student, block access
  const isTeacher = userDoc?.role === 'teacher';
  if ((current.visible === false) && !isTeacher) {
    return (
      <div className="dashboard-main">
        <div className="container">
          <div className="card" style={{ maxWidth: 720, margin: '0 auto' }}>
            <div className="card-content">
              <h3 style={{ marginTop: 0 }}>Materi Tertutup</h3>
              <p>Materi ini belum ditampilkan untuk siswa. Silakan hubungi guru Anda.</p>
              <div className="form-actions">
                <Link className="btn-secondary" to="/belajar">Kembali ke Belajar</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-main">
      <div className="container">
        <div className="card" style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: 8 }}>
            <Link to="/belajar" className="btn-secondary" style={{ display: 'inline-block' }}>← Kembali ke Bab</Link>
          </div>
          <h3 style={{ marginBottom: 8 }}>{data?.title || 'Bab'}</h3>
          <h1 style={{ marginTop: 0 }}>{current.title}</h1>
          <div style={{ marginTop: 12, lineHeight: 1.7, color: '#334155', whiteSpace: 'pre-wrap' }}>
            {current.content || 'Belum ada konten.'}
          </div>
          {normalizedPdfUrl ? (
            <div style={{ marginTop: 16 }} onContextMenu={(e)=>e.preventDefault()}>
              <h4 style={{ margin: '12px 0' }}>Lampiran</h4>
              {/drive\.google\.com/.test(normalizedPdfUrl) ? (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                  <iframe
                    src={normalizedPdfUrl}
                    style={{ width: '100%', height: 600, border: 'none' }}
                    title="Lampiran PDF"
                  />
                </div>
              ) : (
                <PDFViewer url={normalizedPdfUrl} height={600} />
              )}
            </div>
          ) : (
            <div style={{ marginTop: 12, color: '#64748b' }}>Tidak ada lampiran.</div>
          )}
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

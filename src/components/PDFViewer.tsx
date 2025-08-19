import React, { useEffect, useRef, useState } from 'react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';

// Configure worker from CDN to avoid bundling hassles on GH Pages
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.worker.min.js`;

type PDFViewerProps = {
  url: string;
  height?: number;
};

export const PDFViewer: React.FC<PDFViewerProps> = ({ url, height = 600 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    setDoc(null);
    setPageNum(1);
    getDocument({ url, withCredentials: false }).promise
      .then(pdf => {
        if (!mounted) return;
        setDoc(pdf);
        setPageCount(pdf.numPages);
      })
  .catch(() => {
        if (!mounted) return;
        setError('Gagal memuat PDF');
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [url]);

  useEffect(() => {
    const render = async () => {
      if (!doc || !canvasRef.current) return;
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
  await page.render({ canvasContext: ctx as any, canvas: canvas as any, viewport } as any).promise;
    };
    render();
  }, [doc, pageNum]);

  if (loading) return <div className="loading-state"><div className="loading-spinner" /><p>Memuat PDF...</p></div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div style={{ userSelect: 'none' }} onContextMenu={(e)=>e.preventDefault()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ color: '#64748b' }}>Halaman {pageNum} dari {pageCount}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => setPageNum(p => Math.max(1, p - 1))} disabled={pageNum <= 1}>←</button>
          <button className="btn-secondary" onClick={() => setPageNum(p => Math.min(pageCount, p + 1))} disabled={pageNum >= pageCount}>→</button>
        </div>
      </div>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', maxHeight: height }}>
        <canvas ref={canvasRef} style={{ width: '100%', height }} />
      </div>
    </div>
  );
};

export default PDFViewer;

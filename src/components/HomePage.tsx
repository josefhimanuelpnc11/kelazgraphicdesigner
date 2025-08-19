import { useEffect, useState } from 'react';
import Hero3D from './Hero3D';
import './HomePage.css';

interface HomePageProps {
  onLoginClick: () => void;
}

export const HomePage = ({ onLoginClick }: HomePageProps) => {
  const [activeSection, setActiveSection] = useState('home');
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    // Read hash query for msg=rejected
    const hash = window.location.hash || '';
    const qIndex = hash.indexOf('?');
    if (qIndex >= 0) {
      const params = new URLSearchParams(hash.substring(qIndex + 1));
      if ((params.get('msg') || '') === 'rejected') {
        setBanner('Maaf, pendaftaran Anda ditolak oleh guru. Silakan hubungi guru untuk informasi lebih lanjut.');
      }
    }
  }, []);

  return (
    <div className="home-page">
      {/* Header/Navigation */}
  <header className="header">
        <div className="container">
          <div className="logo">
            <h2>Kelaz</h2>
            <span>Kelas Desain Grafis Online</span>
          </div>
          <nav className="nav">
            <ul>
                <li><a href="#home" className={activeSection === 'home' ? 'active' : ''} onClick={() => setActiveSection('home')}>Beranda</a></li>
                  <li><button className="btn-login" onClick={onLoginClick}>Masuk</button></li>
            </ul>
          </nav>
        </div>
      </header>
      {banner && (
        <div className="container" style={{ marginTop: 12 }}>
          <div className="error-message" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
            {banner}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Belajar Desain Grafis Secara Online</h1>
            <p>Bergabunglah dengan kelas desain grafis online gratis kami. Kuasai dasar-dasar desain melalui materi interaktif, kuis, dan proyek langsung.</p>
            <div className="hero-stats">
              <div className="stat">
                <h3>Gratis</h3>
                <p>Kursus 100% Gratis</p>
              </div>
              <div className="stat">
                <h3>Online</h3>
                <p>Belajar di Mana Saja</p>
              </div>
            </div>
            <div className="hero-buttons">
                <button className="hero-btn hero-btn--primary" onClick={onLoginClick}>Mulai Belajar</button>
                <button
                  className="hero-btn hero-btn--ghost hero-btn--icon"
                  onClick={() => {
                    const el = document.getElementById('modules');
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  <span>Lihat Kurikulum</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
            </div>
          </div>
          <div className="hero-image">
            <Hero3D />
          </div>
        </div>
      </section>

      {/* Features Section */}
    <section className="features">
        <div className="container">
      <h2>Mengapa Memilih Kelas Ini?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📚</div>
        <h3>Pelajaran Interaktif</h3>
        <p>Belajar melalui konten menarik dengan teks, gambar, dan materi video.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">❓</div>
        <h3>Kuis & Penilaian</h3>
        <p>Uji pemahaman dengan kuis pilihan ganda dan pantau progres belajar.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
        <h3>Belajar Kelompok Kecil</h3>
        <p>Perhatian lebih personal: maksimal 3 siswa per kelas untuk bimbingan optimal.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💾</div>
        <h3>Pelacakan Progres</h3>
        <p>Monitor perjalanan belajar Anda dan lihat peningkatan dari waktu ke waktu.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Course Modules Section */}
        <section className="modules" id="modules">
        <div className="container">
          <h2>Tingkat Pembelajaran</h2>
          <div className="modules-list">
            <div className="module-card">
              <div className="module-number">01</div>
              <div className="module-content">
                <h3>Basic</h3>
                <p>Pelajari prinsip dasar desain termasuk teori warna, tipografi, dan komposisi.</p>
                <div className="module-meta">
                  <span>5 Materi</span>
                  <span>2 Kuis</span>
                </div>
              </div>
            </div>
            <div className="module-card">
              <div className="module-number">02</div>
              <div className="module-content">
                <h3>Intermediate</h3>
                <p>Membuat karya yang lebih kuat dan memahami pengembangan identitas visual.</p>
                <div className="module-meta">
                  <span>6 Materi</span>
                  <span>3 Kuis</span>
                </div>
              </div>
            </div>
            <div className="module-card">
              <div className="module-number">03</div>
              <div className="module-content">
                <h3>Advanced</h3>
                <p>Kuasai tools desain populer dan teknik lanjutan untuk hasil profesional.</p>
                <div className="module-meta">
                  <span>8 Materi</span>
                  <span>4 Kuis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
    <section className="cta">
        <div className="container">
      <h2>Siap Memulai Perjalanan Desain Anda?</h2>
      <p>Bergabung sekarang dan buka potensi kreatif Anda melalui kelas desain grafis gratis.</p>
      <button className="hero-btn hero-btn--primary" onClick={onLoginClick}>Mulai Sekarang</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>Kelaz Desain Grafis</h3>
              <p>Pembelajaran desain grafis gratis untuk semua.</p>
            </div>
              <div className="footer-section">
              <h4>Akses</h4>
                <ul>
                <li><button onClick={onLoginClick} className="footer-link">Masuk</button></li>
                </ul>
              </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Kelaz Graphic Design Online Class. Free for everyone.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

import { useEffect, useState } from 'react';
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
            <span>Graphic Design Online Class</span>
          </div>
          <nav className="nav">
            <ul>
              <li><a href="#home" className={activeSection === 'home' ? 'active' : ''} onClick={() => setActiveSection('home')}>Home</a></li>
              <li><a href="#courses" className={activeSection === 'courses' ? 'active' : ''} onClick={() => setActiveSection('courses')}>Courses</a></li>
              <li><a href="#about" className={activeSection === 'about' ? 'active' : ''} onClick={() => setActiveSection('about')}>About</a></li>
              <li><a href="#contact" className={activeSection === 'contact' ? 'active' : ''} onClick={() => setActiveSection('contact')}>Contact</a></li>
              <li><button className="btn-login" onClick={onLoginClick}>Login</button></li>
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
            <h1>Learn Graphic Design Online</h1>
            <p>Join our free online graphic design class. Master the fundamentals of design with interactive lessons, quizzes, and hands-on projects.</p>
            <div className="hero-stats">
              <div className="stat">
                <h3>3</h3>
                <p>Active Students</p>
              </div>
              <div className="stat">
                <h3>Free</h3>
                <p>100% Free Course</p>
              </div>
              <div className="stat">
                <h3>Online</h3>
                <p>Learn Anywhere</p>
              </div>
            </div>
            <div className="hero-buttons">
              <button className="btn-primary" onClick={onLoginClick}>Start Learning</button>
              <button className="btn-secondary">View Curriculum</button>
            </div>
          </div>
          <div className="hero-image">
            <div className="design-placeholder">
              <div className="design-element element-1">📐</div>
              <div className="design-element element-2">🎨</div>
              <div className="design-element element-3">✏️</div>
              <div className="design-element element-4">📱</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2>Why Choose Our Online Class?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>Interactive Lessons</h3>
              <p>Learn through engaging content with text, images, and video materials.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">❓</div>
              <h3>Quiz & Assessment</h3>
              <p>Test your knowledge with multiple-choice quizzes and track your progress.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Small Group Learning</h3>
              <p>Personal attention with only 3 students per class for better guidance.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💾</div>
              <h3>Progress Tracking</h3>
              <p>Monitor your learning journey and see your improvement over time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Course Modules Section */}
      <section className="modules">
        <div className="container">
          <h2>Course Modules</h2>
          <div className="modules-list">
            <div className="module-card">
              <div className="module-number">01</div>
              <div className="module-content">
                <h3>Design Fundamentals</h3>
                <p>Learn the basic principles of design including color theory, typography, and composition.</p>
                <div className="module-meta">
                  <span>5 Lessons</span>
                  <span>2 Quizzes</span>
                </div>
              </div>
            </div>
            <div className="module-card">
              <div className="module-number">02</div>
              <div className="module-content">
                <h3>Logo Design</h3>
                <p>Create memorable logos and understand brand identity development.</p>
                <div className="module-meta">
                  <span>6 Lessons</span>
                  <span>3 Quizzes</span>
                </div>
              </div>
            </div>
            <div className="module-card">
              <div className="module-number">03</div>
              <div className="module-content">
                <h3>Digital Design Tools</h3>
                <p>Master popular design software and digital design techniques.</p>
                <div className="module-meta">
                  <span>8 Lessons</span>
                  <span>4 Quizzes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Ready to Start Your Design Journey?</h2>
          <p>Join our free online graphic design class today and unlock your creative potential.</p>
          <button className="btn-primary btn-large" onClick={onLoginClick}>Get Started Now</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>Kelaz Graphic Design</h3>
              <p>Free online graphic design education for everyone.</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="#courses">Courses</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
                <li><button onClick={onLoginClick} className="footer-link">Login</button></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Platform Info</h4>
              <p>Built with React + TypeScript</p>
              <p>Powered by Firebase</p>
              <p>Hosted on GitHub Pages</p>
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

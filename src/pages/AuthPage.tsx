import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import './AuthPage.css';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [formError, setFormError] = useState('');
  
  const { login, register, loginWithGoogle, loading, isAuthenticated } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear form error when user starts typing
    if (formError) setFormError('');
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password) {
      setFormError('Email dan kata sandi wajib diisi');
      return false;
    }

    if (!isLogin) {
      if (!formData.name) {
        setFormError('Nama wajib diisi');
        return false;
      }
      if (formData.password.length < 6) {
        setFormError('Kata sandi minimal 6 karakter');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setFormError('Kata sandi tidak cocok');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!validateForm()) return;

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.email, formData.password, formData.name);
      }
    } catch (error) {
  setFormError(error instanceof Error ? error.message : 'Terjadi kesalahan');
    }
  };

  const handleGoogleLogin = async () => {
    setFormError('');
    try {
      await loginWithGoogle();
    } catch (error) {
  setFormError(error instanceof Error ? error.message : 'Masuk dengan Google gagal');
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      name: '',
      confirmPassword: ''
    });
    setFormError('');
  };

  const handleBack = () => {
    if (isAuthenticated) {
      window.location.hash = '#/dashboard';
    } else {
      window.location.hash = '#/';
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Kelaz Desain Grafis</h1>
          <p>Platform Pembelajaran Online</p>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button 
              className={`tab ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
              type="button"
            >
              Masuk
            </button>
            <button 
              className={`tab ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
              type="button"
            >
              Daftar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="name">Nama Lengkap</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Masukkan nama lengkap"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Alamat Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Masukkan email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Kata Sandi</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Masukkan kata sandi"
                required
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Konfirmasi Kata Sandi</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Konfirmasi kata sandi"
                  required={!isLogin}
                />
              </div>
            )}

            {formError && (
              <div className="error-message">
                {formError}
              </div>
            )}

            <button 
              type="submit" 
              className="btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Mohon tunggu...' : (isLogin ? 'Masuk' : 'Buat Akun')}
            </button>
          </form>

          <div className="auth-divider">
            <span>atau</span>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="btn-google"
            disabled={loading}
          >
            <span className="google-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" focusable="false" role="img">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12S17.4 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.8 16 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z"/>
                <path fill="#4CAF50" d="M24 44c5.3 0 10.2-2 13.9-5.3l-6.4-5.4C29.4 34.5 26.9 36 24 36c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.7 39.6 16.3 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.8-3 5.2-5.6 6.8l.1-.1 6.4 5.4C34.9 42 40 38 42.9 32.3c1.1-2.1 1.7-4.6 1.7-7.3 0-1.2-.1-2.3-.4-3.5z"/>
              </svg>
            </span>
            Lanjutkan dengan Google
          </button>

          <div className="auth-footer">
            <p>
              {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
              <button 
                type="button" 
                onClick={toggleMode} 
                className="link-button"
              >
                {isLogin ? 'Daftar' : 'Masuk'}
              </button>
            </p>
            <p className="back-row">
              <button
                type="button"
                onClick={handleBack}
                className="link-button"
              >
                ← Kembali ke Dashboard
              </button>
            </p>
            <div className="role-info">
              <p>📚 Bergabung dengan kelas desain grafis online gratis</p>
              <p>🚀 Mulai belajar dengan materi interaktif dan kuis</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

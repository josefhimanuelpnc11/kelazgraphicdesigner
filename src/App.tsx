// no hooks here
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { HomePage } from './components/HomePage';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './components/Dashboard';
import LearnPage from './pages/LearnPage';
import QuizzesPage from './pages/QuizzesPage';
import LessonPage from './pages/LessonPage';
import TakeQuizPage from './pages/TakeQuizPage';
import EditQuizPage from './pages/EditQuizPage';
import './App.css';

function Protected({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, loading, userDoc } = useAuth();
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  // If student but not yet approved, block access and show waiting notice
  const isPendingStudent = userDoc?.role === 'student' && (userDoc?.status ?? 'approved') !== 'approved';
  if (isPendingStudent) {
    return (
      <div className="dashboard-main">
        <div className="container">
          <div className="card" style={{ maxWidth: 720, margin: '0 auto' }}>
            <div className="card-content">
              <h3 style={{ marginTop: 0 }}>Menunggu Persetujuan Guru</h3>
              <p>Akun Anda telah terdaftar sebagai siswa, namun akses belajar masih menunggu persetujuan dari guru.</p>
              <p>Silakan tunggu. Setelah disetujui, Anda dapat mulai belajar.</p>
              <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={() => window.location.reload()}>Cek Lagi</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // If rejected or user profile missing (deleted), redirect to Home with message
  const isRejectedOrMissing = !userDoc || (userDoc?.status === 'rejected');
  if (isRejectedOrMissing) {
    return <Navigate to="/?msg=rejected" replace />;
  }
  return children;
}

function App() {
  const { isAuthenticated, loading, userDoc } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
  <Route path="/" element={
            // If user is rejected or profile missing, show Home (with message via query)
            (isAuthenticated && (!userDoc || userDoc.status === 'rejected'))
              ? <HomePage onLoginClick={() => { window.location.hash = '#/auth'; }} />
              : (isAuthenticated ? <Navigate to="/dashboard" replace /> : <HomePage onLoginClick={() => { window.location.hash = '#/auth'; }} />)
          } />
        <Route
          path="/auth"
          element={
            isAuthenticated
              ? ((!userDoc || userDoc.status === 'rejected')
                  ? <Navigate to="/?msg=rejected" replace />
                  : <Navigate to="/dashboard" replace />)
              : <AuthPage />
          }
        />
        <Route
          path="/dashboard"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/belajar"
          element={
            <Protected>
              <LearnPage />
            </Protected>
          }
        />
        <Route
          path="/belajar/m/:moduleId/lesson/:lessonId"
          element={
            <Protected>
              <LessonPage />
            </Protected>
          }
        />
        <Route
          path="/kuis"
          element={
            <Protected>
              <QuizzesPage />
            </Protected>
          }
        />
        <Route
          path="/kuis/:quizId"
          element={
            <Protected>
              <TakeQuizPage />
            </Protected>
          }
        />
        <Route
          path="/dashboard/edit-quiz/:quizId"
          element={
            <Protected>
              <EditQuizPage />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;

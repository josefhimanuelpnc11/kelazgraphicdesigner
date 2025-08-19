// no hooks here
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { HomePage } from './components/HomePage';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './components/Dashboard';
import LearnPage from './pages/LearnPage';
import QuizzesPage from './pages/QuizzesPage';
import LessonPage from './pages/LessonPage';
import './App.css';

function Protected({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, loading } = useAuth();
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
  return children;
}

function App() {
  const { isAuthenticated, loading } = useAuth();

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
  <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <HomePage onLoginClick={() => { window.location.hash = '#/auth'; }} />} />
        <Route
          path="/auth"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;

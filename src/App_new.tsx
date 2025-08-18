import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { HomePage } from './components/HomePage';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './components/Dashboard';
import './App.css';

function App() {
  const [showAuth, setShowAuth] = useState(false);
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

  // Show dashboard if user is authenticated
  if (isAuthenticated) {
    return <Dashboard />;
  }

  // Show auth page if requested
  if (showAuth) {
    return <AuthPage />;
  }

  // Show homepage by default
  return (
    <HomePage onLoginClick={() => setShowAuth(true)} />
  );
}

export default App;

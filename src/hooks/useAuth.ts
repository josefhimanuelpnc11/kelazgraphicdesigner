import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase';
import { authService } from '../services/auth';
import type { UserDoc } from '../types';

export interface AuthState {
  user: User | null;
  userDoc: UserDoc | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userDoc: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        if (user) {
          // Get user document from Firestore
          const userDoc = await authService.getUserFromFirestore(user.uid);
          setAuthState({
            user,
            userDoc,
            loading: false,
            error: null
          });
        } else {
          setAuthState({
            user: null,
            userDoc: null,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await authService.loginWithEmail(email, password);
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }));
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await authService.loginWithGoogle();
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Google login failed'
      }));
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      // Role will be determined automatically based on email in the service
      await authService.registerWithEmail(email, password, name);
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      }));
      throw error;
    }
  };

  const logout = async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await authService.logout();
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Logout failed'
      }));
      throw error;
    }
  };

  return {
    ...authState,
    login,
    loginWithGoogle,
    register,
    logout,
    isAuthenticated: !!authState.user,
    isTeacher: authState.userDoc?.role === 'teacher',
    isStudent: authState.userDoc?.role === 'student'
  };
};

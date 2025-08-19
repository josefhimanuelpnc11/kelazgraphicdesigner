import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
  type UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import type { UserDoc, UserRole, UserStatus } from '../types';

export const authService = {
  // Helper function to determine user role based on email
  getUserRole(_email?: string): UserRole {
  // Default role for all users (teachers managed in Firestore by admin)
  return 'student';
  },

  // Register with email and password
  async registerWithEmail(email: string, password: string, name: string, role?: UserRole): Promise<User> {
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
  // Determine role based on email if not explicitly provided
  const userRole = role || this.getUserRole(email);
  const status: UserStatus = userRole === 'teacher' ? 'approved' : 'pending';
      
      // Save user data to Firestore
      await this.saveUserToFirestore(user.uid, {
        name,
        email: user.email || email,
        role: userRole,
        status,
        createdAt: serverTimestamp() as any
      });
      
      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Login with email and password
  async loginWithEmail(email: string, password: string): Promise<User> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
  // Load user profile to ensure it exists for downstream consumers
  await this.getUserFromFirestore(user.uid);
      
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Login with Google
  async loginWithGoogle(): Promise<User> {
    try {
      const userCredential: UserCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;
      // Ensure Firestore profile exists; create default student if missing
      const existing = await this.getUserFromFirestore(user.uid);
      if (!existing) {
        const userRole = this.getUserRole(user.email || '');
        const status: UserStatus = userRole === 'teacher' ? 'approved' : 'pending';
        await this.saveUserToFirestore(user.uid, {
          name: user.displayName || 'Unknown',
          email: user.email || '',
          role: userRole,
          status,
          createdAt: serverTimestamp() as any
        });
      }
      return user;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  // Save user to Firestore
  async saveUserToFirestore(uid: string, userData: UserDoc): Promise<void> {
    try {
      await setDoc(doc(db, 'users', uid), userData);
    } catch (error) {
      console.error('Error saving user to Firestore:', error);
      throw error;
    }
  },

  // Get user from Firestore
  async getUserFromFirestore(uid: string): Promise<UserDoc | null> {
    try {
      const docSnap = await getDoc(doc(db, 'users', uid));
      if (docSnap.exists()) {
  const userData = docSnap.data() as UserDoc;
  return userData;
      }
      return null;
    } catch (error) {
      console.error('Error getting user from Firestore:', error);
      throw error;
    }
  },

  // Update user role (for fixing existing users)
  async updateUserRole(uid: string, role: UserRole): Promise<void> {
    try {
      const userDoc = await this.getUserFromFirestore(uid);
      if (userDoc) {
        const updatedData = { ...userDoc, role };
        await this.saveUserToFirestore(uid, updatedData);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  }
};

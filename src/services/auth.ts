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
  getUserRole(email: string): UserRole {
    // Special email for teacher
    if (email === 'josefhimanuel123@gmail.com') {
      return 'teacher';
    }
    // Default role for all other users
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
      
      // Check and update role if needed for teacher email
      const userDoc = await this.getUserFromFirestore(user.uid);
      if (userDoc && email === 'josefhimanuel123@gmail.com' && userDoc.role !== 'teacher') {
        console.log('Updating existing user role to teacher');
        await this.updateUserRole(user.uid, 'teacher');
      }
      
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
      
      // Check if user exists in Firestore, if not create profile
      const userDoc = await this.getUserFromFirestore(user.uid);
      if (!userDoc) {
        // Determine role based on email
        const userRole = this.getUserRole(user.email || '');
        const status: UserStatus = userRole === 'teacher' ? 'approved' : 'pending';
        await this.saveUserToFirestore(user.uid, {
          name: user.displayName || 'Unknown',
          email: user.email || '',
          role: userRole,
          status,
          createdAt: serverTimestamp() as any
        });
      } else {
        // Check if existing user needs role update
        if (user.email === 'josefhimanuel123@gmail.com' && userDoc.role !== 'teacher') {
          console.log('Updating existing Google user role to teacher');
          await this.updateUserRole(user.uid, 'teacher');
        }
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
        
        // Check if we need to update role for teacher email
        if (userData.email === 'josefhimanuel123@gmail.com' && userData.role !== 'teacher') {
          console.log('Updating role to teacher for:', userData.email);
          const updatedData = { ...userData, role: 'teacher' as UserRole };
          await this.saveUserToFirestore(uid, updatedData);
          return updatedData;
        }
        
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

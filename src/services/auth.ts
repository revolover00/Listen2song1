import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile, 
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from './firebase';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Convert Firebase User to a simple profile object
export function mapFirebaseUser(user: FirebaseUser | null): UserProfile | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

/**
 * Sign up a new user with email, password and display name
 */
export async function signUpUser(email: string, password: string, displayName: string): Promise<UserProfile> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized or configured.');
  }
  
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Update the user's profile with the display name
  await updateProfile(user, {
    displayName: displayName,
  });
  
  return mapFirebaseUser(user)!;
}

/**
 * Sign in an existing user with email and password
 */
export async function signInUser(email: string, password: string): Promise<UserProfile> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized or configured.');
  }
  
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return mapFirebaseUser(userCredential.user)!;
}

/**
 * Sign in using Google Provider
 */
export async function signInWithGoogle(): Promise<UserProfile> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized or configured.');
  }
  
  const provider = new GoogleAuthProvider();
  // Set custom parameters if needed, or just sign in
  const userCredential = await signInWithPopup(auth, provider);
  return mapFirebaseUser(userCredential.user)!;
}

/**
 * Sign out the current user
 */
export async function signOutUser(): Promise<void> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized or configured.');
  }
  await signOut(auth);
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: UserProfile | null) => void): () => void {
  if (!auth) {
    // If no real Firebase initialized, return a no-op cleanup
    callback(null);
    return () => {};
  }
  
  return onAuthStateChanged(auth, (user) => {
    callback(mapFirebaseUser(user));
  });
}

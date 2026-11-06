import { create } from 'zustand';

export type AuthStatus = 'initializing' | 'signedOut' | 'signedIn';

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
};

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  /**
   * Whether the signed-in user is listed in `adminUsers`. This only controls
   * what the UI shows. Real enforcement happens in Firestore Security Rules and
   * Cloud Functions, which never trust this value.
   */
  isAdmin: boolean;
  setSignedIn: (user: AuthUser) => void;
  setSignedOut: () => void;
  /** Merges changes (e.g. a new display name) into the signed-in user. */
  updateUser: (changes: Partial<AuthUser>) => void;
  setIsAdmin: (isAdmin: boolean) => void;
};

export const useAuthStore = create<AuthState>()((set) => ({
  status: 'initializing',
  user: null,
  isAdmin: false,
  setSignedIn: (user) => set({ status: 'signedIn', user }),
  setSignedOut: () => set({ status: 'signedOut', user: null, isAdmin: false }),
  updateUser: (changes) => set((s) => (s.user ? { user: { ...s.user, ...changes } } : {})),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
}));

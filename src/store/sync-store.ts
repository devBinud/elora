import { create } from 'zustand';

type SyncState = {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: number | null;
  lastError: string | null;
  setSyncing: (isSyncing: boolean) => void;
  setPendingCount: (pendingCount: number) => void;
  setSynced: (at: number) => void;
  setError: (message: string | null) => void;
};

export const useSyncStore = create<SyncState>()((set) => ({
  isSyncing: false,
  pendingCount: 0,
  lastSyncedAt: null,
  lastError: null,
  setSyncing: (isSyncing) => set({ isSyncing }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setSynced: (lastSyncedAt) => set({ lastSyncedAt, lastError: null }),
  setError: (lastError) => set({ lastError }),
}));

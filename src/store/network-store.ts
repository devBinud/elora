import { create } from 'zustand';

type NetworkState = {
  /** `null` until the first NetInfo reading arrives. */
  isOnline: boolean | null;
  setOnline: (isOnline: boolean) => void;
};

export const useNetworkStore = create<NetworkState>()((set) => ({
  isOnline: null,
  setOnline: (isOnline) => set({ isOnline }),
}));

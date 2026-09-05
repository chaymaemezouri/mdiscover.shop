import { create } from 'zustand';

export type AccountModalMode = 'login' | 'register';

export const useAccountModal = create<{
  isOpen: boolean;
  mode: AccountModalMode;
  open: (mode?: AccountModalMode) => void;
  close: () => void;
  setMode: (mode: AccountModalMode) => void;
}>((set) => ({
  isOpen: false,
  mode: 'login',
  open: (mode = 'login') => set({ isOpen: true, mode }),
  close: () => set({ isOpen: false }),
  setMode: (mode) => set({ mode }),
}));

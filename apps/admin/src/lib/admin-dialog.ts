'use client';

import { create } from 'zustand';

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

export type AlertOptions = {
  title?: string;
  message: string;
  variant?: 'info' | 'error' | 'success';
  okLabel?: string;
};

type ConfirmState = {
  open: true;
  kind: 'confirm';
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
};

type AlertState = {
  open: true;
  kind: 'alert';
  options: AlertOptions;
  resolve: () => void;
};

type IdleState = { open: false };

type DialogState = (ConfirmState | AlertState | IdleState) & {
  confirm: (options: string | ConfirmOptions) => Promise<boolean>;
  alert: (options: string | AlertOptions) => Promise<void>;
  closeConfirm: (value: boolean) => void;
  closeAlert: () => void;
};

export const useAdminDialog = create<DialogState>((set, get) => ({
  open: false,
  confirm: (input) =>
    new Promise<boolean>((resolve) => {
      const options: ConfirmOptions =
        typeof input === 'string' ? { message: input, danger: true } : input;
      set({
        open: true,
        kind: 'confirm',
        options: {
          title: options.title ?? 'Confirmation',
          confirmLabel: options.confirmLabel ?? (options.danger ? 'Supprimer' : 'Confirmer'),
          cancelLabel: options.cancelLabel ?? 'Annuler',
          danger: options.danger ?? true,
          message: options.message,
        },
        resolve,
      } as DialogState);
    }),
  alert: (input) =>
    new Promise<void>((resolve) => {
      const options: AlertOptions =
        typeof input === 'string' ? { message: input } : input;
      set({
        open: true,
        kind: 'alert',
        options: {
          title:
            options.title ??
            (options.variant === 'error'
              ? 'Erreur'
              : options.variant === 'success'
                ? 'Succès'
                : 'Information'),
          okLabel: options.okLabel ?? 'OK',
          variant: options.variant ?? 'info',
          message: options.message,
        },
        resolve,
      } as DialogState);
    }),
  closeConfirm: (value) => {
    const state = get();
    if (state.open && state.kind === 'confirm') {
      state.resolve(value);
      set({ open: false } as DialogState);
    }
  },
  closeAlert: () => {
    const state = get();
    if (state.open && state.kind === 'alert') {
      state.resolve();
      set({ open: false } as DialogState);
    }
  },
}));

/** Confirm dialog — remplace window.confirm */
export function adminConfirm(options: string | ConfirmOptions) {
  return useAdminDialog.getState().confirm(options);
}

/** Alert dialog — remplace window.alert */
export function adminAlert(options: string | AlertOptions) {
  return useAdminDialog.getState().alert(options);
}

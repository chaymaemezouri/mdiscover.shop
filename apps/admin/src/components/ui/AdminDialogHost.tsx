'use client';

import { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useAdminDialog } from '@/lib/admin-dialog';

export function AdminDialogHost() {
  const state = useAdminDialog();

  useEffect(() => {
    if (!state.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (state.kind === 'confirm') state.closeConfirm(false);
        else state.closeAlert();
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [state]);

  if (!state.open) return null;

  if (state.kind === 'confirm') {
    const { options } = state;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <button
          type="button"
          aria-label="Fermer"
          className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
          onClick={() => state.closeConfirm(false)}
        />
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="admin-confirm-title"
          aria-describedby="admin-confirm-desc"
          className="relative w-full max-w-md rounded-xl border border-[var(--admin-line)] bg-white p-5 sm:p-6 shadow-[0_24px_64px_rgba(0,0,0,0.18)]"
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                options.danger ? 'bg-red-50 text-red-600' : 'bg-[var(--admin-rose-soft)] text-[var(--admin-rose)]'
              }`}
            >
              <AlertTriangle size={18} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 id="admin-confirm-title" className="text-base font-semibold text-[var(--admin-black)]">
                {options.title}
              </h2>
              <p id="admin-confirm-desc" className="mt-1.5 text-sm leading-relaxed text-[var(--admin-muted)]">
                {options.message}
              </p>
            </div>
            <button
              type="button"
              className="admin-btn-ghost -mr-1 -mt-1 p-1.5"
              onClick={() => state.closeConfirm(false)}
            >
              <X size={16} />
            </button>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="admin-btn-outline text-sm py-2 px-4"
              onClick={() => state.closeConfirm(false)}
            >
              {options.cancelLabel}
            </button>
            <button
              type="button"
              className={
                options.danger
                  ? 'inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors'
                  : 'admin-btn text-sm py-2 px-4'
              }
              onClick={() => state.closeConfirm(true)}
              autoFocus
            >
              {options.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { options } = state;
  const Icon =
    options.variant === 'error' ? AlertTriangle : options.variant === 'success' ? CheckCircle2 : Info;
  const iconClass =
    options.variant === 'error'
      ? 'bg-red-50 text-red-600'
      : options.variant === 'success'
        ? 'bg-emerald-50 text-emerald-600'
        : 'bg-[var(--admin-rose-soft)] text-[var(--admin-rose)]';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={() => state.closeAlert()}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-alert-title"
        aria-describedby="admin-alert-desc"
        className="relative w-full max-w-md rounded-xl border border-[var(--admin-line)] bg-white p-5 sm:p-6 shadow-[0_24px_64px_rgba(0,0,0,0.18)]"
      >
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
            <Icon size={18} />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 id="admin-alert-title" className="text-base font-semibold text-[var(--admin-black)]">
              {options.title}
            </h2>
            <p id="admin-alert-desc" className="mt-1.5 text-sm leading-relaxed text-[var(--admin-muted)] whitespace-pre-wrap">
              {options.message}
            </p>
          </div>
          <button type="button" className="admin-btn-ghost -mr-1 -mt-1 p-1.5" onClick={() => state.closeAlert()}>
            <X size={16} />
          </button>
        </div>
        <div className="mt-6 flex justify-end">
          <button type="button" className="admin-btn text-sm py-2 px-4" onClick={() => state.closeAlert()} autoFocus>
            {options.okLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { AdminDialogHost } from '@/components/ui/AdminDialogHost';
import { APP_NAME } from '@mdiscovershop/shared';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="min-h-screen lg:flex">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-[var(--admin-line)] bg-white px-3 py-2.5 lg:hidden">
        <button
          type="button"
          className="admin-btn-ghost p-2"
          aria-label="Ouvrir le menu"
          onClick={() => setOpen(true)}
        >
          <Menu size={20} />
        </button>
        <Link href="/" className="flex items-center gap-2 min-w-0" aria-label={APP_NAME}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/admin/logo-clear.png"
            alt={APP_NAME}
            width={140}
            height={40}
            className="h-7 w-auto object-contain"
          />
          <span className="text-xs text-[var(--admin-muted)]">Admin</span>
        </Link>
      </header>

      {/* Mobile backdrop */}
      {open && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar: drawer on mobile, fixed rail on desktop */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-[min(16.5rem,85vw)] transform transition-transform duration-200 ease-out
          lg:static lg:z-auto lg:w-56 lg:shrink-0 lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="absolute right-2 top-2 z-10 lg:hidden">
          <button
            type="button"
            className="rounded-md bg-black/10 p-1.5 text-white hover:bg-black/20"
            aria-label="Fermer"
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <Sidebar />
      </div>

      <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-5 lg:p-8">{children}</main>
      <AdminDialogHost />
    </div>
  );
}

'use client';

import { ReactNode } from 'react';
import { AccountNav } from '@/components/account/AccountNav';

interface AccountShellProps {
  children: ReactNode;
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
}

export function AccountShell({ children, title, eyebrow = 'My account', action }: AccountShellProps) {
  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#FBF8F4]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem]"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 15% 0%, rgb(232 212 213 / 0.45), transparent 58%), radial-gradient(ellipse 50% 45% at 90% 10%, rgb(201 165 168 / 0.22), transparent 60%)',
        }}
        aria-hidden
      />

      <div className="relative w-full px-4 sm:px-8 lg:px-10 xl:px-14 py-8 sm:py-10 lg:py-12">
        <AccountNav />

        {(title || action) && (
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            {title && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#B77D7E] font-sans font-medium mb-1.5">
                  {eyebrow}
                </p>
                <h1 className="font-serif text-2xl sm:text-3xl text-charcoal-900 tracking-tight">{title}</h1>
              </div>
            )}
            {action}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

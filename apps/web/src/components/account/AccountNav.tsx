'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { logoutAccount } from '@/lib/auth-client';

const LINKS = [
  { href: '/compte/profil', label: 'Profile' },
  { href: '/compte/commandes', label: 'Orders' },
  { href: '/compte/adresses', label: 'Addresses' },
  { href: '/compte/wishlist', label: 'Wishlist' },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex flex-wrap items-center gap-1.5 sm:gap-2 border-b border-[#E8D4D5]/80 pb-4">
      {LINKS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-full px-3 sm:px-4 py-2 text-[9px] sm:text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.14em] font-semibold font-sans transition-all ${
              active
                ? 'bg-[#A96868] text-[#FFF9F5] shadow-[0_4px_12px_rgba(169,104,104,0.22)]'
                : 'border border-transparent text-charcoal-600 hover:border-[#E8D4D5] hover:text-[#A96868] hover:bg-[#FFF9F5]'
            }`}
          >
            {label}
          </Link>
        );
      })}

      <button
        type="button"
        onClick={() => logoutAccount()}
        className="mt-1 w-full min-[400px]:mt-0 min-[400px]:ml-auto min-[400px]:w-auto inline-flex items-center justify-center gap-1.5 rounded-full px-3 sm:px-4 py-2 text-[9px] sm:text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.14em] font-semibold text-charcoal-500 font-sans hover:text-[#A96868] hover:bg-[#FFF9F5] transition-colors"
      >
        <LogOut size={14} strokeWidth={1.75} />
        Sign out
      </button>
    </nav>
  );
}

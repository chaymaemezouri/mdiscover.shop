'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  Truck,
  Settings,
  LogOut,
  MessageSquare,
  FolderTree,
  Image as ImageIcon,
  Award,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@mdiscovershop/shared';

const NAV = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/products', icon: Package, label: 'Produits' },
  { href: '/categories', icon: FolderTree, label: 'Catégories' },
  { href: '/brands', icon: Award, label: 'Marques' },
  { href: '/orders', icon: ShoppingCart, label: 'Commandes' },
  { href: '/customers', icon: Users, label: 'Clients' },
  { href: '/contact', icon: Mail, label: 'Contact' },
  { href: '/coupons', icon: Tag, label: 'Promotions' },
  { href: '/reviews', icon: MessageSquare, label: 'Avis' },
  { href: '/media', icon: ImageIcon, label: 'Médias' },
  { href: '/shipping', icon: Truck, label: 'Livraison' },
  { href: '/settings', icon: Settings, label: 'Réglages' },
];

export function Sidebar() {
  const pathname = usePathname();

  function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh_token');
    window.location.href = '/admin/login';
  }

  return (
    <aside className="flex h-full min-h-screen w-full flex-col bg-[var(--admin-rose)] text-white">
      <div className="border-b border-black/10 px-4 py-5 pr-12 lg:pr-4">
        <Link href="/" className="block" aria-label={APP_NAME}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/admin/logo.jpeg"
            alt={APP_NAME}
            width={200}
            height={72}
            className="h-9 w-auto object-contain object-left mix-blend-multiply"
          />
        </Link>
        <p className="mt-2 text-[11px] text-white/70">Admin</p>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[13px] transition-colors',
                active
                  ? 'bg-[var(--admin-black)] text-white'
                  : 'text-white/85 hover:bg-black/10 hover:text-white',
              )}
            >
              <Icon size={16} strokeWidth={1.75} className="shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-black/10 p-3">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-[13px] text-white/75 transition-colors hover:bg-black/10 hover:text-white"
        >
          <LogOut size={16} strokeWidth={1.75} className="shrink-0" />
          Déconnexion
        </button>
        <p className="px-3 pt-2 text-[10px] text-white/45">{APP_NAME}</p>
      </div>
    </aside>
  );
}

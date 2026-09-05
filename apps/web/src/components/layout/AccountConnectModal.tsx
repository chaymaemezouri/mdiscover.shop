'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X, Instagram, Facebook } from 'lucide-react';
import { AccountAuthPanel } from '@/components/account/AccountAuthPanel';
import { useAccountModal } from '@/store/accountModal';
import { getAccessToken } from '@/lib/auth-client';
import { storeWhatsAppUrl } from '@/lib/contact';

const WHATSAPP_URL = storeWhatsAppUrl();
const AUTH_IMAGE = '/categories/brand-story-elixir.jpeg';
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.511-5.16c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function AccountConnectModal() {
  const isOpen = useAccountModal((s) => s.isOpen);
  const mode = useAccountModal((s) => s.mode);
  const close = useAccountModal((s) => s.close);
  const setMode = useAccountModal((s) => s.setMode);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Account"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#1C1714]/45 backdrop-blur-[6px]"
        aria-label="Close"
        onClick={close}
      />

      <div className="relative grid w-full max-w-[960px] max-h-[min(92vh,720px)] overflow-hidden rounded-[22px] border border-[#E8D4D5]/90 bg-[#FFF9F5] shadow-[0_28px_80px_rgba(61,41,40,0.22)] animate-hero-fade md:grid-cols-2">
        <div className="overflow-y-auto p-6 sm:p-8 md:p-10">
          <AccountAuthPanel
            variant="modal"
            initialMode={mode}
            onModeChange={setMode}
            onAuthenticated={close}
          />

          <div className="mt-8 flex items-center gap-5">
            <a href="#" aria-label="Instagram" className="text-[#A96868] hover:text-[#9B6264] transition-colors">
              <Instagram size={20} strokeWidth={1.75} />
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="text-[#A96868] hover:text-[#9B6264] transition-colors"
            >
              <WhatsAppIcon className="w-5 h-5" />
            </a>
            <a href="#" aria-label="Facebook" className="text-[#A96868] hover:text-[#9B6264] transition-colors">
              <Facebook size={20} strokeWidth={1.75} />
            </a>
          </div>
        </div>

        <div className="relative hidden min-h-[280px] md:block">
          <Image
            src={AUTH_IMAGE}
            alt="mDISCOVER skincare"
            fill
            sizes="480px"
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#A96868]/35 via-transparent to-[#1C1714]/10" />

          <button
            type="button"
            onClick={close}
            className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/75 text-[#1C1714] backdrop-blur-sm hover:bg-white transition-colors"
            aria-label="Close"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <button
          type="button"
          onClick={close}
          className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-charcoal-600 hover:bg-[#F8F2ED] transition-colors md:hidden"
          aria-label="Close"
        >
          <X size={18} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

/** Opens account popup, or account area if already signed in. */
export function useOpenAccount() {
  const open = useAccountModal((s) => s.open);
  const router = useRouter();

  return (mode: 'login' | 'register' = 'login') => {
    if (getAccessToken()) {
      router.push('/compte/commandes');
      return;
    }
    open(mode);
  };
}

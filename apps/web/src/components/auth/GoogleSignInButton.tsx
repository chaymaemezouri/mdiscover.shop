'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            el: HTMLElement,
            config: { theme?: string; size?: string; width?: number; type?: string; shape?: string },
          ) => void;
        };
      };
    };
  }
}

interface Props {
  onSuccess: (idToken: string) => void;
  disabled?: boolean;
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.223 36 24 36c-5.522 0-10-4.478-10-10s4.478-10 10-10c2.523 0 4.817.943 6.563 2.488l5.657-5.657C33.64 10.053 29.082 8 24 8 12.955 8 4 16.955 4 28s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 12 24 12c2.523 0 4.817.943 6.563 2.488l5.657-5.657C33.64 10.053 29.082 8 24 8 16.318 8 9.656 13.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 28c0-1.341-.138-2.651-.389-3.917z"
      />
    </svg>
  );
}

export function GoogleSignInButton({ onSuccess, disabled }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !overlayRef.current) return;

    function init() {
      if (!window.google || !overlayRef.current) return;
      const width = Math.min(overlayRef.current.parentElement?.clientWidth ?? 360, 400);
      window.google.accounts.id.initialize({
        client_id: clientId!,
        callback: (response) => onSuccess(response.credential),
      });
      overlayRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(overlayRef.current, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        shape: 'pill',
        width,
      });
    }

    if (window.google) {
      init();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = init;
      document.body.appendChild(script);
    }
  }, [clientId, onSuccess]);

  if (!clientId) {
    return (
      <p className="rounded-xl border border-[#E8D4D5] bg-[#FFF9F5] px-4 py-3 text-center text-[11px] text-charcoal-500 font-sans">
        Google sign-in is not configured yet.
      </p>
    );
  }

  return (
    <div className={`relative w-full ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
      <div className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-full border border-[#E8D4D5] bg-white px-5 text-[11px] uppercase tracking-[0.14em] font-semibold text-charcoal-800 font-sans shadow-[0_2px_12px_rgba(169,104,104,0.06)]">
        <GoogleMark />
        Continue with Google
      </div>
      <div
        ref={overlayRef}
        className="absolute inset-0 z-10 opacity-[0.011] overflow-hidden [&>div]:!h-full [&>div]:!w-full"
        aria-label="Sign in with Google"
      />
    </div>
  );
}

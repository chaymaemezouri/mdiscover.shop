'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '@/lib/auth-client';
import { useAccountModal } from '@/store/accountModal';

export default function AccountPage() {
  const router = useRouter();
  const openAccount = useAccountModal((s) => s.open);

  useEffect(() => {
    if (getAccessToken()) {
      router.replace('/compte/commandes');
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode') === 'register' ? 'register' : 'login';
    openAccount(mode);
    router.replace('/');
  }, [router, openAccount]);

  return (
    <div className="w-full min-h-[40vh] flex items-center justify-center bg-[#FBF8F4] text-charcoal-500 font-sans">
      Loading...
    </div>
  );
}

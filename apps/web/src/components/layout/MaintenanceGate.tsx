'use client';

import { useEffect, useState } from 'react';

import { API_URL } from '@/lib/api';

const SETTINGS_TIMEOUT_MS = 4000;

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), SETTINGS_TIMEOUT_MS);

    fetch(`${API_URL}/cms/settings`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setMaintenance(Boolean(data.store?.maintenanceMode)))
      .catch(() => {
        /* API unavailable — show the store normally */
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, []);

  if (maintenance) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="font-serif text-3xl text-charcoal-900 mb-4">Maintenance en cours</h1>
          <p className="text-charcoal-600">
            Notre boutique est temporairement indisponible. Nous revenons très bientôt.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

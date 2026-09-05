import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAccessToken } from '@/lib/auth-client';

interface WishlistStore {
  count: number;
  productIds: string[];
  badgePulse: boolean;
  setWishlist: (productIds: string[]) => void;
  setCount: (count: number) => void;
  addProductId: (productId: string) => void;
  removeProductId: (productId: string) => void;
  clear: () => void;
  syncFromApi: () => Promise<void>;
}

let pulseTimer: ReturnType<typeof setTimeout> | null = null;

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      count: 0,
      productIds: [],
      badgePulse: false,
      setWishlist: (productIds) =>
        set({
          productIds,
          count: productIds.length,
        }),
      setCount: (count) => set({ count }),
      addProductId: (productId) => {
        const ids = get().productIds;
        if (ids.includes(productId)) return;

        if (pulseTimer) clearTimeout(pulseTimer);
        set({
          productIds: [...ids, productId],
          count: ids.length + 1,
          badgePulse: true,
        });
        pulseTimer = setTimeout(() => set({ badgePulse: false }), 700);
      },
      removeProductId: (productId) => {
        const next = get().productIds.filter((id) => id !== productId);
        set({ productIds: next, count: next.length });
      },
      clear: () => set({ count: 0, productIds: [], badgePulse: false }),
      syncFromApi: async () => {
        const token = getAccessToken();
        if (!token) {
          get().clear();
          return;
        }

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wishlist`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            if (res.status === 401) get().clear();
            return;
          }
          const items = await res.json();
          if (!Array.isArray(items)) return;
          const productIds = items
            .map((item: { productId?: string }) => item.productId)
            .filter((id: string | undefined): id is string => Boolean(id));
          set({ productIds, count: productIds.length });
        } catch {
          /* ignore network errors */
        }
      },
    }),
    {
      name: 'mdiscover-wishlist',
      partialize: (state) => ({
        count: state.count,
        productIds: state.productIds,
      }),
    },
  ),
);

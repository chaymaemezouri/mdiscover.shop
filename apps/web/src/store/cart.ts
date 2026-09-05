import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartAddedNotification {
  id: number;
  productName: string;
  productImage?: string;
  quantity: number;
}

interface CartStore {
  cartId: string | null;
  itemCount: number;
  notification: CartAddedNotification | null;
  cartBadgePulse: boolean;
  setCartId: (id: string) => void;
  setItemCount: (count: number) => void;
  increment: () => void;
  decrement: () => void;
  notifyAdded: (item: Omit<CartAddedNotification, 'id'>) => void;
  clearNotification: () => void;
}

let notificationTimer: ReturnType<typeof setTimeout> | null = null;
let pulseTimer: ReturnType<typeof setTimeout> | null = null;

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      cartId: null,
      itemCount: 0,
      notification: null,
      cartBadgePulse: false,
      setCartId: (id) => set({ cartId: id }),
      setItemCount: (count) => set({ itemCount: count }),
      increment: () => set((s) => ({ itemCount: s.itemCount + 1 })),
      decrement: () => set((s) => ({ itemCount: Math.max(0, s.itemCount - 1) })),
      notifyAdded: (item) => {
        if (notificationTimer) clearTimeout(notificationTimer);
        if (pulseTimer) clearTimeout(pulseTimer);

        set({
          notification: { ...item, id: Date.now() },
          cartBadgePulse: true,
        });

        notificationTimer = setTimeout(() => {
          set({ notification: null });
        }, 3200);

        pulseTimer = setTimeout(() => {
          set({ cartBadgePulse: false });
        }, 700);
      },
      clearNotification: () => {
        if (notificationTimer) clearTimeout(notificationTimer);
        set({ notification: null });
      },
    }),
    {
      name: 'mdiscover-cart',
      partialize: (state) => ({ cartId: state.cartId, itemCount: state.itemCount }),
    },
  ),
);

'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import { getSessionId } from '@/lib/utils';

interface Variant {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface Props {
  productId: string;
  variants: Variant[];
  defaultVariantId?: string;
}

export function AddToCartButton({ productId, variants, defaultVariantId }: Props) {
  const [variantId, setVariantId] = useState(defaultVariantId ?? variants[0]?.id);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const { setCartId, setItemCount } = useCartStore();

  const selected = variants.find((v) => v.id === variantId);
  const outOfStock = selected ? selected.stock <= 0 : false;

  async function handleAdd() {
    setLoading(true);
    try {
      const sessionId = getSessionId();
      const cart = await api.cart.addItem(sessionId, {
        productId,
        variantId,
        quantity: 1,
      });
      setCartId(cart.id);
      setItemCount(cart.itemCount);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {variants.length > 1 && (
        <div>
          <label className="text-xs uppercase tracking-widest text-charcoal-700 block mb-2">Contenance</label>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setVariantId(v.id)}
                disabled={v.stock <= 0}
                className={`px-4 py-2 text-sm border transition-colors ${
                  variantId === v.id
                    ? 'border-charcoal-900 bg-charcoal-900 text-cream-50'
                    : 'border-cream-300 hover:border-charcoal-900'
                } ${v.stock <= 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={loading || outOfStock}
        className="btn-primary w-full md:w-auto disabled:opacity-50"
      >
        {loading ? 'Ajout...' : added ? '✓ Ajouté au panier' : outOfStock ? 'Rupture de stock' : 'Ajouter au panier'}
      </button>
    </div>
  );
}

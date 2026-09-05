'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { AccountShell } from '@/components/account/AccountShell';
import { getAccessToken } from '@/lib/auth-client';

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  city: string;
  isDefault: boolean;
}

const inputClass =
  'w-full rounded-xl border border-[#E8D4D5] bg-white px-4 py-3 text-sm text-charcoal-900 font-sans placeholder:text-[#A89888] focus:outline-none focus:border-[#A96868] focus:ring-2 focus:ring-[#A96868]/10 transition-colors';

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    addressLine1: '',
    city: 'Casablanca',
  });

  function load() {
    const token = getAccessToken();
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setAddresses);
  }

  useEffect(() => {
    if (!getAccessToken()) {
      window.location.href = '/compte';
      return;
    }
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/addresses`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    load();
  }

  async function remove(id: string) {
    const token = getAccessToken();
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/addresses/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    load();
  }

  return (
    <AccountShell
      title="Addresses"
      action={
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-full border border-[#A96868] bg-white px-5 py-2.5 text-[10px] uppercase tracking-[0.14em] font-semibold text-[#A96868] font-sans hover:bg-[#F8F2ED] transition-colors"
        >
          + Add address
        </button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 max-w-4xl">
        {addresses.map((a) => (
          <article
            key={a.id}
            className="rounded-[20px] border border-[#E8D4D5] bg-[#FFF9F5] p-5 shadow-[0_8px_32px_rgba(169,104,104,0.06)] flex justify-between gap-4"
          >
            <div>
              <p className="font-sans font-semibold text-charcoal-900">
                {a.firstName} {a.lastName}
              </p>
              <p className="text-sm text-charcoal-600 font-sans mt-1">
                {a.addressLine1}, {a.city}
              </p>
              <p className="text-sm text-charcoal-500 font-sans">{a.phone}</p>
              {a.isDefault && (
                <span className="mt-2 inline-block text-[10px] uppercase tracking-[0.12em] text-[#A96868] font-sans font-semibold">
                  Default
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => remove(a.id)}
              className="shrink-0 text-charcoal-400 hover:text-[#A96868] transition-colors self-start"
              aria-label="Delete address"
            >
              <Trash2 size={18} />
            </button>
          </article>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1714]/40 backdrop-blur-sm p-4">
          <form
            onSubmit={add}
            className="w-full max-w-md space-y-3 rounded-[20px] border border-[#E8D4D5] bg-[#FFF9F5] p-6 shadow-[0_24px_64px_rgba(169,104,104,0.18)]"
          >
            <h2 className="font-serif text-xl text-charcoal-900 mb-2">New address</h2>
            <input required placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputClass} />
            <input required placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputClass} />
            <input required placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
            <input required placeholder="Address" value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} className={inputClass} />
            <input required placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} />
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-full border border-[#E8D4D5] bg-white py-3 text-[10px] uppercase tracking-[0.14em] font-semibold text-charcoal-700 font-sans">
                Cancel
              </button>
              <button type="submit" className="flex-1 rounded-full bg-[#A96868] py-3 text-[10px] uppercase tracking-[0.14em] font-semibold text-[#FFF9F5] font-sans hover:bg-[#9B6264] transition-colors">
                Add
              </button>
            </div>
          </form>
        </div>
      )}
    </AccountShell>
  );
}

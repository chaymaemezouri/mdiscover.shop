'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useAccountModal } from '@/store/accountModal';

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  createdAt: string;
  user: { firstName?: string; lastName?: string };
}

interface Props {
  productId: string;
}

const fieldClass =
  'h-11 w-full min-w-0 rounded-xl border border-[#E8D4D5] bg-white px-3 text-sm text-charcoal-900 font-sans placeholder:text-[#A89888] focus:outline-none focus:border-[#A96868] focus:ring-2 focus:ring-[#A96868]/10 transition-colors';

export function ProductReviews({ productId }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const openAccount = useAccountModal((s) => s.open);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/product/${productId}`)
      .then((r) => r.json())
      .then(setReviews)
      .catch(() => {});
  }, [productId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    if (!token) {
      openAccount('login');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, ...form }),
      });
      if (res.ok) {
        setMessage('Thank you! Your review will be published after moderation.');
        setForm({ rating: 5, title: '', comment: '' });
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage(err.message ?? 'Error submitting review');
      }
    } catch {
      setMessage('Network error');
    }
    setSubmitting(false);
  }

  return (
    <section className="mt-12 sm:mt-14 pt-10 border-t border-[#E8D4D5]/80">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:gap-10 xl:gap-12 lg:items-start">
        {/* Liste des avis */}
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[#B77D7E] font-sans font-medium mb-1.5">
            Testimonials
          </p>
          <h2 className="font-serif text-xl sm:text-2xl text-charcoal-900 tracking-tight">Customer reviews</h2>

          {reviews.length > 0 ? (
            <div className="mt-5 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
              {reviews.map((r) => (
                <article
                  key={r.id}
                  className="min-w-[240px] max-w-[280px] shrink-0 snap-start rounded-[16px] border border-[#E8D4D5] bg-[#FFF9F5] p-4 shadow-[0_4px_20px_rgba(169,104,104,0.06)]"
                >
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={13}
                        className={i < r.rating ? 'fill-[#A96868] text-[#A96868]' : 'text-[#E8D4D5]'}
                        strokeWidth={0}
                      />
                    ))}
                    <span className="text-[11px] text-charcoal-500 ml-1.5 font-sans truncate">
                      {[r.user.firstName, r.user.lastName].filter(Boolean).join(' ') || 'Customer'}
                    </span>
                  </div>
                  {r.title && (
                    <h3 className="font-sans text-sm font-semibold text-charcoal-900 line-clamp-1">{r.title}</h3>
                  )}
                  {r.comment && (
                    <p className="mt-1 text-[13px] leading-relaxed text-charcoal-600 font-sans line-clamp-4">
                      {r.comment}
                    </p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-charcoal-500 font-sans">
              Be the first to leave a review.
            </p>
          )}
        </div>

        {/* Formulaire horizontal */}
        <form
          onSubmit={submit}
          className="rounded-[20px] border border-[#E8D4D5] bg-[#FFF9F5] p-5 sm:p-6 shadow-[0_8px_32px_rgba(169,104,104,0.06)]"
        >
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#B77D7E] font-sans font-semibold">
            Leave a review
          </h3>

          <div className="mt-4 flex flex-col md:flex-row md:flex-wrap md:items-end gap-3">
            <div className="shrink-0 md:w-[7.5rem]">
              <label htmlFor="review-rating" className="sr-only">
                Rating
              </label>
              <select
                id="review-rating"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                className={fieldClass}
                aria-label="Rating"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} star{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="shrink-0 md:w-[11rem]">
              <label htmlFor="review-title" className="sr-only">
                Title
              </label>
              <input
                id="review-title"
                placeholder="Title (optional)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={fieldClass}
              />
            </div>

            <div className="min-w-0 flex-1">
              <label htmlFor="review-comment" className="sr-only">
                Your review
              </label>
              <textarea
                id="review-comment"
                placeholder="Your review"
                required
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                rows={1}
                className={`${fieldClass} h-11 min-h-[2.75rem] max-h-24 resize-y py-2.5 md:resize-none`}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="shrink-0 h-11 px-5 sm:px-6 rounded-full bg-[#A96868] text-[#FFF9F5] text-[10px] uppercase tracking-[0.14em] font-semibold font-sans shadow-[0_4px_14px_rgba(169,104,104,0.28)] hover:bg-[#9B6264] transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {submitting ? 'Submitting...' : 'Submit review'}
            </button>
          </div>

          {message && (
            <p className="mt-3 text-sm text-charcoal-600 font-sans">{message}</p>
          )}
        </form>
      </div>
    </section>
  );
}

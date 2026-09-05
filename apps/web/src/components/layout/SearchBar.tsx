'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import { useLocale } from '@/i18n/store';

interface SearchResult {
  slug: string;
  name: string;
  price: number;
  images: { url: string }[];
}

type SearchBarProps = {
  /** inline = compact field in navbar · popover = icon + dropdown (hero) */
  variant?: 'inline' | 'popover';
  tone?: 'page' | 'hero';
};

export function SearchBar({ variant = 'inline', tone = 'page' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { t } = useLocale();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_URL}/products/search?q=${encodeURIComponent(query)}`,
        );
        if (res.ok) setResults(await res.json());
      } catch {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function goToSearch() {
    if (!query.trim()) return;
    router.push(`/products?q=${encodeURIComponent(query.trim())}`);
    setOpen(false);
    setQuery('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    goToSearch();
  }

  const fieldClass =
    tone === 'hero'
      ? 'border-[#1C1714]/15 bg-white/60 text-[#1C1714] placeholder:text-[#1C1714]/45'
      : 'border-[#E8D4D5] bg-white/90 text-charcoal-900 placeholder:text-[#A89888]';

  const iconClass = tone === 'hero' ? 'text-[#1C1714]/70' : 'text-[#B77D7E]';

  const resultsPanel = open && (results.length > 0 || query.length >= 2) && (
    <div
      className={`absolute top-[calc(100%+6px)] right-0 z-50 w-64 sm:w-72 overflow-hidden rounded-xl border shadow-[0_12px_40px_rgba(169,104,104,0.12)] ${
        tone === 'hero'
          ? 'border-[#FFF9F5]/15 bg-[#A96868]/95 backdrop-blur-md'
          : 'border-[#E8D4D5] bg-[#FFF9F5]'
      }`}
    >
      {results.length > 0 ? (
        <div className="max-h-72 overflow-y-auto py-1">
          {results.map((r) => (
            <button
              key={r.slug}
              type="button"
              onClick={() => {
                router.push(`/products/${r.slug}`);
                setOpen(false);
                setQuery('');
              }}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                tone === 'hero' ? 'hover:bg-white/10' : 'hover:bg-[#F8F2ED]'
              }`}
            >
              {r.images[0] && (
                <div
                  className="h-9 w-9 shrink-0 rounded-lg bg-cover bg-center border border-[#E8D4D5]/60"
                  style={{ backgroundImage: `url(${r.images[0].url})` }}
                />
              )}
              <div className="min-w-0">
                <p className={`truncate text-xs font-medium font-sans ${tone === 'hero' ? 'text-[#1C1714]' : 'text-charcoal-900'}`}>
                  {r.name}
                </p>
                <p className={`text-[10px] font-sans ${tone === 'hero' ? 'text-[#1C1714]/65' : 'text-charcoal-500'}`}>
                  {formatPrice(r.price)}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className={`px-4 py-3 text-xs font-sans ${tone === 'hero' ? 'text-[#1C1714]/60' : 'text-charcoal-500'}`}>
          {t('nav.searchNoResults')}
        </p>
      )}
    </div>
  );

  if (variant === 'popover') {
    const toggleSearch = () => setOpen((v) => !v);

    return (
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={toggleSearch}
          aria-label={t('nav.searchLabel')}
          aria-expanded={open}
          className={
            tone === 'hero'
              ? 'hero-icon-btn hero-header-icon flex shrink-0 items-center justify-center rounded-full transition-colors duration-[280ms]'
              : 'flex items-center justify-center w-10 h-10 min-w-[44px] min-h-[44px] shrink-0 rounded-full text-[#3A322C] hover:bg-[#EDE5DC] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-400'
          }
        >
          <Search size={tone === 'hero' ? 17 : 18} strokeWidth={1.35} />
        </button>
        {open && (
          <form
            onSubmit={handleSubmit}
            className={`absolute top-[calc(100%+6px)] right-0 z-50 flex w-56 sm:w-64 items-center gap-2 border px-3 py-2 shadow-[0_8px_28px_rgba(169,104,104,0.14)] ${
              tone === 'hero' ? 'rounded-full' : ''
            } ${fieldClass}`}
          >
            <Search size={14} className={`shrink-0 ${iconClass}`} strokeWidth={1.35} />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              placeholder={t('nav.search')}
              className="w-full bg-transparent text-xs outline-none font-sans"
              autoFocus
            />
          </form>
        )}
        {resultsPanel}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative hidden min-[900px]:block">
      <form
        onSubmit={handleSubmit}
        className={`flex items-center gap-2 border px-3 py-1.5 w-36 lg:w-44 xl:w-48 transition-colors focus-within:border-[#A96868] focus-within:ring-2 focus-within:ring-[#A96868]/10 ${fieldClass}`}
      >
        <Search size={14} className={`shrink-0 ${iconClass}`} strokeWidth={1.35} />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search..."
          className="w-full min-w-0 bg-transparent text-[11px] outline-none font-sans tracking-wide"
          aria-label={t('nav.searchLabel')}
        />
      </form>
      {resultsPanel}
    </div>
  );
}

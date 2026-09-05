import { APP_NAME } from '@mdiscovershop/shared';

type ProductBrandLabelProps = {
  productName: string;
  tagline?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      className={className}
    >
      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="1.2" opacity="0.85" />
      <path
        d="M24 8c-2 6-2 12 0 18"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.9"
      />
      <circle cx="30" cy="14" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function ProductBrandLabel({
  productName,
  tagline = 'Timeless beauty ritual',
  size = 'md',
  className = '',
}: ProductBrandLabelProps) {
  const sizes = {
    sm: {
      wrap: 'px-4 py-3 min-w-[9rem]',
      mark: 'w-7 h-7',
      brand: 'text-[10px] tracking-[0.28em]',
      name: 'text-[11px]',
      tag: 'text-[7px] tracking-[0.14em]',
    },
    md: {
      wrap: 'px-6 py-4 min-w-[11rem]',
      mark: 'w-9 h-9',
      brand: 'text-xs tracking-[0.32em]',
      name: 'text-sm',
      tag: 'text-[8px] tracking-[0.16em]',
    },
    lg: {
      wrap: 'px-8 py-5 min-w-[13rem]',
      mark: 'w-11 h-11',
      brand: 'text-sm tracking-[0.34em]',
      name: 'text-base',
      tag: 'text-[9px] tracking-[0.18em]',
    },
  }[size];

  return (
    <div
      className={`inline-flex flex-col items-center justify-center text-center rounded-sm bg-gradient-to-b from-[#E8D4C5] via-[#D9C4A8] to-[#C9A882] text-[#3D2829] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_20px_-8px_rgba(61,40,41,0.25)] ${sizes.wrap} ${className}`}
    >
      <BrandMark className={`${sizes.mark} mb-2 opacity-90`} />
      <p className={`font-serif uppercase font-medium leading-none ${sizes.brand}`}>
        {APP_NAME.toUpperCase()}
      </p>
      <p className={`font-serif mt-2 leading-snug ${sizes.name}`}>{productName}</p>
      {tagline && (
        <p className={`mt-2 uppercase opacity-75 font-normal leading-tight max-w-[10rem] ${sizes.tag}`}>
          {tagline}
        </p>
      )}
    </div>
  );
}

export function isGoldCaviarLine(slug: string) {
  return slug.includes('caviar') || slug.includes('gold-caviar');
}

export const GOLD_CAVIAR_TAGLINE = 'Timeless beauty ritual';

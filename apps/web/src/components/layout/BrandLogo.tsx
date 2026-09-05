import { APP_NAME } from '@mdiscovershop/shared';

type BrandLogoProps = {
  className?: string;
  /** Text wordmark — avoids legacy logo.png showing "DISCOVER" without m */
  wordmark?: boolean;
  wordmarkClassName?: string;
  /** Kept for API compatibility; logo is always transparent PNG now */
  lightBackground?: boolean;
};

export function BrandLogo({
  className = 'h-10 md:h-12 w-auto object-contain',
  wordmark = false,
  wordmarkClassName = 'text-[15px] sm:text-[16px] tracking-[0.26em] text-[#FFFDFC]/94 font-sans',
}: BrandLogoProps) {
  if (wordmark) {
    return (
      <span className={wordmarkClassName} aria-label={APP_NAME}>
        <span className="normal-case lowercase">m</span>
        <span className="uppercase">DISCOVER</span>
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-clear.png"
      alt={APP_NAME}
      width={260}
      height={72}
      className={className}
      decoding="async"
    />
  );
}

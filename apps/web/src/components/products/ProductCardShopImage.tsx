'use client';

import Image from 'next/image';
import { useState } from 'react';

interface Props {
  src: string;
  alt: string;
  name: string;
}

export function ProductCardShopImage({ src, alt, name }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="flex h-full items-center justify-center bg-gradient-to-b from-[#F8F2ED] to-[#FFF9F5]"
        aria-hidden
      >
        <div className="h-12 w-12 rounded-full border border-[#E8D4D5]/80 bg-white/50" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="product-card-shop-image object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      sizes="(max-width:1024px) 22vw, 18vw"
      onError={() => setFailed(true)}
    />
  );
}

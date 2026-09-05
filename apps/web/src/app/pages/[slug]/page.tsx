import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { APP_NAME } from '@mdiscovershop/shared';
import { FaqPageContent } from '@/components/faq/FaqPageContent';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export const dynamic = 'force-dynamic';

async function getPage(slug: string) {
  try {
    const res = await fetch(`${API_URL}/cms/pages/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  if (params.slug === 'faq') {
    return {
      title: `FAQ | ${APP_NAME}`,
      description:
        'Questions fréquentes mDISCOVER — livraison au Maroc, paiement à la livraison, retours et conseils soins.',
    };
  }
  const page = await getPage(params.slug);
  return { title: page?.titleFr ? `${page.titleFr} | ${APP_NAME}` : params.slug };
}

export default async function CmsPage({ params }: { params: { slug: string } }) {
  if (params.slug === 'faq') {
    return <FaqPageContent />;
  }

  const page = await getPage(params.slug);
  if (!page) notFound();

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 py-10 sm:py-16">
      <h1 className="section-title mb-6 sm:mb-8 text-[clamp(1.5rem,5vw,2rem)]">{page.titleFr}</h1>
      <div
        className="prose prose-neutral max-w-none text-charcoal-600 leading-relaxed prose-p:break-words prose-img:rounded-xl"
        dangerouslySetInnerHTML={{ __html: page.contentFr }}
      />
    </div>
  );
}

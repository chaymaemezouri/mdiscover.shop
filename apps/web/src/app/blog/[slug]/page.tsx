import Link from 'next/link';
import { notFound } from 'next/navigation';
import { APP_NAME } from '@mdiscovershop/shared';

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
}

async function getPost(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/blog/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const post = await getPost(params.slug);
  return post
    ? { title: post.titleFr, description: post.excerptFr }
    : { title: 'Article' };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.titleFr,
    description: post.excerptFr,
    image: post.coverImageUrl,
    datePublished: post.publishedAt,
    author: { '@type': 'Organization', name: APP_NAME },
    publisher: { '@type': 'Organization', name: APP_NAME },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/blog" className="text-sm text-pink-600 hover:underline mb-6 inline-block">
          ← Retour au blog
        </Link>

        {post.coverImageUrl && (
          <div
            className="aspect-[21/9] bg-cream-200 mb-8 bg-cover bg-center"
            style={{ backgroundImage: `url(${post.coverImageUrl})` }}
          />
        )}

        <header className="mb-8">
          {post.publishedAt && (
            <time className="text-xs uppercase tracking-widest text-charcoal-500">
              {new Date(post.publishedAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </time>
          )}
          <h1 className="font-serif text-4xl text-charcoal-900 mt-2">{post.titleFr}</h1>
          {post.excerptFr && <p className="text-charcoal-600 mt-4 text-lg">{post.excerptFr}</p>}
        </header>

        {post.contentFr && (
          <div
            className="prose prose-charcoal max-w-none text-charcoal-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.contentFr }}
          />
        )}
      </article>
    </>
  );
}

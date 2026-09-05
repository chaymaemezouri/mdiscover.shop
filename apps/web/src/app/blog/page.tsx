import Link from 'next/link';

export const metadata = { title: 'Blog' };

async function getPosts() {
  try {
    return await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/blog`, { next: { revalidate: 60 } }).then((r) => r.json());
  } catch {
    return { data: [] };
  }
}

export default async function BlogPage() {
  const { data: posts = [] } = (await getPosts()) ?? { data: [] };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="section-title mb-8">Blog Beauté</h1>
      {posts.length === 0 ? (
        <p className="text-charcoal-500 text-center py-12">Articles à venir prochainement.</p>
      ) : (
        <div className="space-y-8">
          {posts.map((post: { slug: string; titleFr: string; excerptFr?: string; coverImageUrl?: string; publishedAt?: string }) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
              <article className="flex gap-6 bg-white border border-cream-300 p-6 hover:shadow-lg transition-shadow">
                {post.coverImageUrl && (
                  <div className="w-32 h-32 bg-cream-200 shrink-0 bg-cover bg-center" style={{ backgroundImage: `url(${post.coverImageUrl})` }} />
                )}
                <div>
                  <h2 className="font-serif text-xl group-hover:text-pink-600 transition-colors">{post.titleFr}</h2>
                  {post.excerptFr && <p className="text-charcoal-500 text-sm mt-2">{post.excerptFr}</p>}
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

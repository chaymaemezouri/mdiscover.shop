import { api } from '@/lib/api';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoryCarousel } from '@/components/home/CategoryCarousel';
import { HomeNewProducts, HomeBestsellers } from '@/components/home/HomeFeaturedSections';
import { BrandIntroSection } from '@/components/home/BrandIntroSection';
import { NewsletterForm } from '@/components/home/NewsletterForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getFeaturedProducts() {
  try {
    return await api.products.featured();
  } catch {
    return { newProducts: [], bestsellers: [] };
  }
}

async function getCategories() {
  try {
    return await api.categories.list();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [{ newProducts, bestsellers }, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);

  return (
    <>
      <HeroSection hotspotProducts={[...bestsellers, ...newProducts]} />

      <CategoryCarousel categories={categories} />

      <HomeNewProducts products={newProducts} />

      <BrandIntroSection />

      <HomeBestsellers products={bestsellers} />

      <NewsletterForm />
    </>
  );
}

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

@Injectable()
export class AdminCmsService {
  constructor(private prisma: PrismaService) {}

  // ─── Pages ────────────────────────────────────────────────
  async listPages(search?: string, isPublished?: string) {
    const where: Prisma.PageWhereInput = {};
    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { titleFr: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (isPublished === 'true') where.isPublished = true;
    if (isPublished === 'false') where.isPublished = false;

    return this.prisma.page.findMany({ where, orderBy: { slug: 'asc' } });
  }

  async getPage(id: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Page introuvable');
    return page;
  }

  async updatePage(id: string, data: Record<string, unknown>) {
    await this.getPage(id);
    return this.prisma.page.update({
      where: { id },
      data: {
        ...(data.titleFr !== undefined && { titleFr: String(data.titleFr) }),
        ...(data.titleEn !== undefined && { titleEn: (data.titleEn as string) || null }),
        ...(data.titleAr !== undefined && { titleAr: (data.titleAr as string) || null }),
        ...(data.contentFr !== undefined && { contentFr: String(data.contentFr) }),
        ...(data.contentEn !== undefined && { contentEn: (data.contentEn as string) || null }),
        ...(data.contentAr !== undefined && { contentAr: (data.contentAr as string) || null }),
        ...(data.seoTitle !== undefined && { seoTitle: (data.seoTitle as string) || null }),
        ...(data.seoDescription !== undefined && {
          seoDescription: (data.seoDescription as string) || null,
        }),
        ...(data.isPublished !== undefined && { isPublished: Boolean(data.isPublished) }),
      },
    });
  }

  // ─── Blog ─────────────────────────────────────────────────
  async listBlogPosts(search?: string, isPublished?: string) {
    const where: Prisma.BlogPostWhereInput = {};
    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { titleFr: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (isPublished === 'true') where.isPublished = true;
    if (isPublished === 'false') where.isPublished = false;

    return this.prisma.blogPost.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async getBlogPost(id: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Article introuvable');
    return post;
  }

  async createBlogPost(data: Record<string, unknown>) {
    const titleFr = String(data.titleFr ?? '').trim();
    if (!titleFr) throw new ConflictException('Titre requis');
    const slug = ((data.slug as string)?.trim() || slugify(titleFr)).toLowerCase();
    const existing = await this.prisma.blogPost.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Slug déjà utilisé');

    const isPublished = Boolean(data.isPublished);
    return this.prisma.blogPost.create({
      data: {
        slug,
        titleFr,
        titleAr: (data.titleAr as string) || null,
        titleEn: (data.titleEn as string) || null,
        contentFr: String(data.contentFr ?? ''),
        contentAr: (data.contentAr as string) || null,
        contentEn: (data.contentEn as string) || null,
        excerptFr: (data.excerptFr as string) || null,
        coverImageUrl: (data.coverImageUrl as string) || null,
        category: (data.category as string) || null,
        seoTitle: (data.seoTitle as string) || null,
        seoDescription: (data.seoDescription as string) || null,
        isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
    });
  }

  async updateBlogPost(id: string, data: Record<string, unknown>) {
    const post = await this.getBlogPost(id);
    if (data.slug && String(data.slug) !== post.slug) {
      const slug = slugify(String(data.slug));
      const existing = await this.prisma.blogPost.findUnique({ where: { slug } });
      if (existing) throw new ConflictException('Slug déjà utilisé');
      data.slug = slug;
    }

    const isPublished = data.isPublished !== undefined ? Boolean(data.isPublished) : undefined;
    return this.prisma.blogPost.update({
      where: { id },
      data: {
        ...(data.slug !== undefined && { slug: String(data.slug) }),
        ...(data.titleFr !== undefined && { titleFr: String(data.titleFr) }),
        ...(data.titleAr !== undefined && { titleAr: (data.titleAr as string) || null }),
        ...(data.titleEn !== undefined && { titleEn: (data.titleEn as string) || null }),
        ...(data.contentFr !== undefined && { contentFr: String(data.contentFr) }),
        ...(data.contentAr !== undefined && { contentAr: (data.contentAr as string) || null }),
        ...(data.contentEn !== undefined && { contentEn: (data.contentEn as string) || null }),
        ...(data.excerptFr !== undefined && { excerptFr: (data.excerptFr as string) || null }),
        ...(data.coverImageUrl !== undefined && {
          coverImageUrl: (data.coverImageUrl as string) || null,
        }),
        ...(data.category !== undefined && { category: (data.category as string) || null }),
        ...(data.seoTitle !== undefined && { seoTitle: (data.seoTitle as string) || null }),
        ...(data.seoDescription !== undefined && {
          seoDescription: (data.seoDescription as string) || null,
        }),
        ...(isPublished !== undefined && {
          isPublished,
          publishedAt: isPublished ? post.publishedAt ?? new Date() : null,
        }),
      },
    });
  }

  async deleteBlogPost(id: string) {
    await this.getBlogPost(id);
    return this.prisma.blogPost.delete({ where: { id } });
  }

  // ─── Banners ──────────────────────────────────────────────
  async listBanners(isActive?: string) {
    const where: Prisma.HomeBannerWhereInput = {};
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;
    return this.prisma.homeBanner.findMany({ where, orderBy: { sortOrder: 'asc' } });
  }

  async getBanner(id: string) {
    const banner = await this.prisma.homeBanner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('Bannière introuvable');
    return banner;
  }

  async createBanner(data: Record<string, unknown>) {
    const titleFr = String(data.titleFr ?? '').trim();
    const imageUrl = String(data.imageUrl ?? '').trim();
    if (!titleFr) throw new ConflictException('Titre requis');
    if (!imageUrl) throw new ConflictException('Image requise');

    return this.prisma.homeBanner.create({
      data: {
        titleFr,
        titleAr: (data.titleAr as string) || null,
        titleEn: (data.titleEn as string) || null,
        subtitleFr: (data.subtitleFr as string) || null,
        imageUrl,
        linkUrl: (data.linkUrl as string) || null,
        sortOrder: Number(data.sortOrder) || 0,
        isActive: data.isActive === undefined ? true : Boolean(data.isActive),
      },
    });
  }

  async updateBanner(id: string, data: Record<string, unknown>) {
    await this.getBanner(id);
    return this.prisma.homeBanner.update({
      where: { id },
      data: {
        ...(data.titleFr !== undefined && { titleFr: String(data.titleFr) }),
        ...(data.titleAr !== undefined && { titleAr: (data.titleAr as string) || null }),
        ...(data.titleEn !== undefined && { titleEn: (data.titleEn as string) || null }),
        ...(data.subtitleFr !== undefined && { subtitleFr: (data.subtitleFr as string) || null }),
        ...(data.imageUrl !== undefined && { imageUrl: String(data.imageUrl) }),
        ...(data.linkUrl !== undefined && { linkUrl: (data.linkUrl as string) || null }),
        ...(data.sortOrder !== undefined && { sortOrder: Number(data.sortOrder) || 0 }),
        ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
      },
    });
  }

  async deleteBanner(id: string) {
    await this.getBanner(id);
    return this.prisma.homeBanner.delete({ where: { id } });
  }
}

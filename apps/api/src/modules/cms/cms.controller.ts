import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CmsService } from './cms.service';

@ApiTags('cms')
@Controller('cms')
export class CmsController {
  constructor(private cmsService: CmsService) {}

  @Get('banners')
  @ApiOperation({ summary: 'Bannières page d\'accueil' })
  getBanners() {
    return this.cmsService.getBanners();
  }

  @Get('pages/:slug')
  @ApiOperation({ summary: 'Page statique' })
  getPage(@Param('slug') slug: string) {
    return this.cmsService.getPage(slug);
  }

  @Get('blog')
  @ApiOperation({ summary: 'Liste articles blog' })
  getBlogPosts(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.cmsService.getBlogPosts(page, limit);
  }

  @Get('blog/:slug')
  @ApiOperation({ summary: 'Article blog' })
  getBlogPost(@Param('slug') slug: string) {
    return this.cmsService.getBlogPost(slug);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Paramètres publics du site' })
  getSettings() {
    return this.cmsService.getPublicSettings();
  }
}

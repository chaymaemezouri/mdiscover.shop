import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductQueryDto } from './dto/product-query.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des produits avec filtres' })
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Recherche produits (autocomplétion)' })
  search(@Query('q') q: string, @Query('limit') limit?: number) {
    return this.productsService.search(q, limit ?? 8);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Produits mis en avant (nouveautés & bestsellers)' })
  findFeatured() {
    return this.productsService.findFeatured();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Détail produit par slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }
}

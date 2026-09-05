import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { AdminAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, ADMIN_ROLE_GROUPS } from '../auth/decorators/roles.decorator';

@ApiTags('admin')
@Controller('admin')
@UseGuards(AdminAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StorageController {
  constructor(private storage: StorageService) {}

  @Post('upload/image')
  @Roles(...ADMIN_ROLE_GROUPS.cms, ...ADMIN_ROLE_GROUPS.products)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      // 50 Mo — JPEG, PNG, WebP, HEIC, SVG, GIF, etc.
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const mime = (file.mimetype || '').toLowerCase();
        const name = (file.originalname || '').toLowerCase();
        const extOk = /\.(jpe?g|png|gif|webp|avif|bmp|svg|heic|heif|tiff?|ico)$/i.test(name);
        const mimeOk =
          mime.startsWith('image/') ||
          mime === 'application/octet-stream' ||
          mime === '';
        if (mimeOk || extOk) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Fichier image requis (jpg, png, webp, heic, svg…)'), false);
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Fichier requis');
    return this.storage.upload(file);
  }

  @Get('media')
  @Roles(...ADMIN_ROLE_GROUPS.cms, ...ADMIN_ROLE_GROUPS.products)
  @ApiOperation({ summary: 'Médiathèque' })
  listMedia(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.storage.listMedia(page, limit);
  }

  @Delete('media/:id')
  @Roles(...ADMIN_ROLE_GROUPS.cms, ...ADMIN_ROLE_GROUPS.products)
  @ApiOperation({ summary: 'Supprimer un média' })
  deleteMedia(@Param('id') id: string) {
    return this.storage.deleteMedia(id);
  }
}

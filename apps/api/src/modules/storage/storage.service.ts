import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client | null = null;
  private bucket: string;
  private publicUrl: string;
  private bucketReady: Promise<void> | null = null;
  private localDir: string;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.bucket = config.get('S3_BUCKET', 'mdiscover-assets');
    this.publicUrl = config.get('S3_PUBLIC_URL', `http://localhost:9000/${this.bucket}`);
    this.localDir = path.join(process.cwd(), 'uploads');
    const endpoint = config.get('S3_ENDPOINT');
    if (endpoint) {
      this.client = new S3Client({
        endpoint,
        region: config.get('S3_REGION', 'us-east-1'),
        credentials: {
          accessKeyId: config.get('S3_ACCESS_KEY', 'minioadmin'),
          secretAccessKey: config.get('S3_SECRET_KEY', 'minioadmin'),
        },
        forcePathStyle: true,
      });
      this.bucketReady = this.ensureBucket();
    }
  }

  private async ensureBucket() {
    if (!this.client) return;
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Created S3 bucket ${this.bucket}`);
      } catch (err) {
        this.logger.warn(`Could not create bucket ${this.bucket}: ${err}`);
      }
    }
    await this.ensurePublicRead();
  }

  /** Allow browsers to load images via S3_PUBLIC_URL without auth. */
  private async ensurePublicRead() {
    if (!this.client) return;
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucket}/*`],
        },
      ],
    });
    try {
      await this.client.send(
        new PutBucketPolicyCommand({ Bucket: this.bucket, Policy: policy }),
      );
    } catch (err) {
      this.logger.warn(`Could not set public-read policy on ${this.bucket}: ${err}`);
    }
  }

  private saveLocal(file: Express.Multer.File, key: string): string {
    const full = path.join(this.localDir, key);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, file.buffer);
    const apiPublic = this.config.get('API_PUBLIC_URL', 'http://localhost:4000');
    return `${apiPublic}/uploads/${key.replace(/\\/g, '/')}`;
  }

  async upload(file: Express.Multer.File, folder = 'products') {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Fichier image invalide ou vide');
    }

    const ext = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const key = `${folder}/${uuidv4()}.${ext}`;
    let url: string;
    let storedKey: string | null = key;

    if (this.client) {
      try {
        if (this.bucketReady) await this.bucketReady;
        try {
          await this.client.send(
            new PutObjectCommand({
              Bucket: this.bucket,
              Key: key,
              Body: file.buffer,
              ContentType: file.mimetype,
              ACL: 'public-read',
            }),
          );
        } catch {
          await this.client.send(
            new PutObjectCommand({
              Bucket: this.bucket,
              Key: key,
              Body: file.buffer,
              ContentType: file.mimetype,
            }),
          );
        }
        url = `${this.publicUrl}/${key}`;
      } catch (err) {
        this.logger.error(`S3 upload failed, falling back to local: ${err}`);
        url = this.saveLocal(file, key);
        storedKey = `local:${key}`;
      }
    } else {
      this.logger.warn('S3 not configured — saving locally');
      url = this.saveLocal(file, key);
      storedKey = `local:${key}`;
    }

    const asset = await this.prisma.mediaAsset.create({
      data: {
        url,
        key: storedKey,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        folder,
      },
    });

    return { url: asset.url, id: asset.id };
  }

  async listMedia(page = 1, limit = 40) {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 40));
    const skip = (pageNum - 1) * limitNum;
    const [data, total] = await Promise.all([
      this.prisma.mediaAsset.findMany({
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.mediaAsset.count(),
    ]);
    return {
      data,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    };
  }

  async deleteMedia(id: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Média introuvable');

    if (this.client && asset.key && !asset.key.startsWith('local:')) {
      try {
        await this.client.send(
          new DeleteObjectCommand({ Bucket: this.bucket, Key: asset.key }),
        );
      } catch (err) {
        this.logger.warn(`Failed to delete S3 object ${asset.key}: ${err}`);
      }
    } else if (asset.key?.startsWith('local:')) {
      const localPath = path.join(this.localDir, asset.key.replace(/^local:/, ''));
      try {
        fs.unlinkSync(localPath);
      } catch {
        /* ignore */
      }
    }

    await this.prisma.mediaAsset.delete({ where: { id } });
    return { ok: true };
  }
}

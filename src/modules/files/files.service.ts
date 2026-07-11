import {
  Injectable,
  Inject,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MINIO_CLIENT } from 'src/config/minio.config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

export type BucketName = 'avatars' | 'resumes';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
  private readonly allowedDocTypes = ['application/pdf'];
  private readonly maxImageSize = 5 * 1024 * 1024; // 5 MB
  private readonly maxDocSize = 10 * 1024 * 1024; // 10 MB

  constructor(
    @Inject(MINIO_CLIENT) private readonly minio: Minio.Client,
    private readonly config: ConfigService,
  ) {}

  async uploadAvatar(file: Express.Multer.File, talentId: string): Promise<string> {
    this.validateImage(file);
    const ext = file.originalname.split('.').pop();
    const objectName = `${talentId}/${uuidv4()}.${ext}`;
    return this.upload('avatars', objectName, file);
  }

  async uploadResume(file: Express.Multer.File, talentId: string): Promise<string> {
    const objectName = `${talentId}/${uuidv4()}.pdf`;
    return this.upload('resumes', objectName, file);
  }

  private async upload(
    bucket: string,
    objectName: string,
    file: Express.Multer.File,
  ): Promise<string> {
    try {
      await this.minio.putObject(bucket, objectName, file.buffer, file.size, {
        'Content-Type': file.mimetype,
      });
      this.logger.log(`Upload with success: ${bucket}/${objectName}`);
      return this.buildPublicUrl(bucket, objectName);
    } catch (error: any) {
      this.logger.error(`Error uploading file: ${error.message}`);
      throw new InternalServerErrorException('Error uploading file');
    }
  }

  private buildPublicUrl(bucket: string, objectName: string): string {
    const endpoint: string = this.config.get('MINIO_ENDPOINT', 'localhost');
    const port: string = this.config.get('MINIO_PORT', '9000');
    const ssl = this.config.get('MINIO_USE_SSL', 'false') === 'true';
    const protocol = ssl ? 'https' : 'http';
    return `${protocol}://${endpoint}:${port}/${bucket}/${objectName}`;
  }

  async getPresignedUrl() {}

  async deleteObject(bucket: BucketName, objectName: string): Promise<void> {
    try {
      await this.minio.removeObject(bucket, objectName);
    } catch (error: any) {
      this.logger.error(`Error deleting object: ${error.message}`);
      throw new InternalServerErrorException('Error deleting object');
    }
  }

  private validateImage(file: Express.Multer.File): void {
    if (!this.allowedImageTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid image type');
    }
    if (file.size > this.maxImageSize) {
      throw new BadRequestException('Image size exceeds limit');
    }
  }

  private validateDocument(file: Express.Multer.File): void {
    if (!this.allowedDocTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid document type');
    }
    if (file.size > this.maxDocSize) {
      throw new BadRequestException('Document size exceeds limit');
    }
  }
}

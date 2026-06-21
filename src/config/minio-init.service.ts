import { OnModuleInit, Injectable, Inject, Logger } from '@nestjs/common';
import * as Minio from 'minio';
import { MINIO_CLIENT } from './minio.config';

const BUCKETS = ['avatar', 'resumes'] as const;

@Injectable()
export class MinioInitService implements OnModuleInit {
  private readonly logger = new Logger(MinioInitService.name);
  constructor(@Inject(MINIO_CLIENT) private readonly minio: Minio.Client) {}

  async onModuleInit(): Promise<void> {
    for (const bucket of BUCKETS) {
      await this.ensureBucket(bucket);
    }
  }

  private async ensureBucket(bucket: string): Promise<void> {
    try {
      const exists = await this.minio.bucketExists(bucket);
      if (!exists) {
        await this.minio.makeBucket(bucket);
        this.logger.log(`Bucket ${bucket} created successfully`);
      } else {
        this.logger.log(`Bucket ${bucket} already exists`);
      }
    } catch (err: any) {
      this.logger.error(`Errore inizializzando bucket "${bucket}": ${err.message}`);
      throw err; // blocca l'avvio se MinIO non è raggiungibile
    }
  }
}

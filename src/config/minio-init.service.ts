import { OnModuleInit, Injectable, Inject, Logger } from '@nestjs/common';
import * as Minio from 'minio';
import { MINIO_CLIENT } from './minio.config';

const BUCKETS = ['avatars', 'resumes'] as const;
const PUBLIC_BUCKETS = ['avatars'] as const;

@Injectable()
export class MinioInitService implements OnModuleInit {
  private readonly logger = new Logger(MinioInitService.name);
  constructor(@Inject(MINIO_CLIENT) private readonly minio: Minio.Client) {}

  async onModuleInit(): Promise<void> {
    for (const bucket of BUCKETS) {
      await this.ensureBucket(bucket);
    }
    for (const bucket of PUBLIC_BUCKETS) {
      await this.ensurePublicPolicy(bucket);
    }
  }

  private async ensureBucket(bucket: string): Promise<void> {
    try {
      const exists = await this.minio.bucketExists(bucket);
      if (!exists) {
        await this.minio.makeBucket(bucket);
        this.logger.log(`Bucket ${bucket} created successfully`);
      } else {
        //await this.minio.removeBucket(bucket);

        this.logger.log(`Bucket ${bucket} already exists`);
      }
    } catch (err: any) {
      this.logger.error(`Errore inizializzando bucket "${bucket}": ${err.message}`);
      throw err; // blocca l'avvio se MinIO non è raggiungibile
    }
  }

  private async ensurePublicPolicy(bucket: string): Promise<void> {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucket}/*`],
        },
      ],
    };

    try {
      await this.minio.setBucketPolicy(bucket, JSON.stringify(policy));
      this.logger.log(`Public read policy applied to bucket "${bucket}"`);
    } catch (err: any) {
      this.logger.error(`Error applying public policy to bucket "${bucket}": ${err.message}`);
      throw err;
    }
  }
}

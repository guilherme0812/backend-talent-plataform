// src/config/minio.config.ts
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

export const MINIO_CLIENT = 'MINIO_CLIENT';

export const createMinioClient = (config: ConfigService): Minio.Client => {
  return new Minio.Client({
    endPoint: config.get<string>('MINIO_ENDPOINT', 'localhost'),
    port: config.get<number>('MINIO_PORT', 9000),
    useSSL: config.get<string>('MINIO_USE_SSL', 'false') === 'true',
    accessKey: config.get<string>('MINIO_ROOT_USER', 'minioadmin'),
    secretKey: config.get<string>('MINIO_ROOT_PASSWORD', 'minioadmin123'),
  });
};

import { OnModuleInit, Injectable, Inject } from '@nestjs/common';
import * as Minio from 'minio';
import { MINIO_CLIENT } from './minio.config';

const BUCKETS = ['avatar', 'resumes'] as const;

@Injectable()
export class MinioInitService implements OnModuleInit {
  constructor(@Inject(MINIO_CLIENT) private readonly minio: Minio.Client) {}

  onModuleInit() {
    console.log('MinioInitService initialized');
    // Here you can add your Minio initialization logic, such as creating buckets or setting up connections.
  }
}

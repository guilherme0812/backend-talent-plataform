import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { createMinioClient, MINIO_CLIENT } from 'src/config/minio.config';
import { ConfigService } from '@nestjs/config';
import { FilesController } from './files.controller';
import { MinioInitService } from '../../config/minio-init.service';
import { TalentModule } from '../talent/talent.module';

@Module({
  imports: [TalentModule],
  providers: [
    {
      provide: MINIO_CLIENT,
      useFactory: (configService: ConfigService) => createMinioClient(configService),
      inject: [ConfigService],
    },
    FilesService,
    MinioInitService,
  ],
  controllers: [FilesController],
})
export class FilesModule {}

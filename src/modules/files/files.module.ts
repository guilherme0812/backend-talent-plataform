import { forwardRef, Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { createMinioClient, MINIO_CLIENT } from 'src/config/minio.config';
import { ConfigService } from '@nestjs/config';
import { FilesController } from './files.controller';
import { MinioInitService } from '../../config/minio-init.service';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { TalentModule } from '../talent/talent.module';

@Module({
  imports: [EmbeddingsModule, forwardRef(() => TalentModule)],
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
  exports: [FilesService],
})
export class FilesModule {}

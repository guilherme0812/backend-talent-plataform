import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Talent } from '../talent/entities/talent.entity';
import { EmbeddingsController } from './embeddings.controller';
import { EmbeddingsService } from './embeddings.service';

@Module({
  imports: [TypeOrmModule.forFeature([Talent])],
  providers: [EmbeddingsService],
  controllers: [EmbeddingsController],
  exports: [EmbeddingsService],
})
export class EmbeddingsModule {}

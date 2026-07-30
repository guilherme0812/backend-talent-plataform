import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Talent } from '../talent/entities/talent.entity';
import { EmbeddingsController } from './embeddings.controller';
import { EmbeddingsService } from './embeddings.service';
import { TalentEmbedding } from './entities/talent-embedding.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Talent, TalentEmbedding])],
  providers: [EmbeddingsService],
  controllers: [EmbeddingsController],
  exports: [EmbeddingsService],
})
export class EmbeddingsModule {}

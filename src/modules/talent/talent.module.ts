import { forwardRef, Module } from '@nestjs/common';
import { TalentService } from './talent.service';
import { TalentController } from './talent.controller';
import { Talent } from './entities/talent.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [TypeOrmModule.forFeature([Talent]), forwardRef(() => FilesModule), EmbeddingsModule],
  providers: [TalentService],
  controllers: [TalentController],
  exports: [TalentService],
})
export class TalentModule {}

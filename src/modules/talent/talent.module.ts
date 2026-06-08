import { Module } from '@nestjs/common';
import { TalentService } from './talent.service';
import { TalentController } from './talent.controller';
import { Talent } from './entities/talent.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Talent])],
  providers: [TalentService],
  controllers: [TalentController],
})
export class TalentModule {}

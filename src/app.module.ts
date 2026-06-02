import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TalentModule } from './modules/talent/talent.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [TalentModule],
})
export class AppModule {}

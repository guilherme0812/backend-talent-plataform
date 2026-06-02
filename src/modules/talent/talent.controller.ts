import { Controller, Get } from '@nestjs/common';
import { TalentService } from './talent.service';

@Controller()
export class TalentController {
  constructor(readonly talentService: TalentService) {}

  @Get('test')
  getTest(): string {
    return this.talentService.getHello();
  }
}

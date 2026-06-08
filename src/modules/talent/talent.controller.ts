import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { TalentService } from './talent.service';

@Controller('talents')
export class TalentController {
  constructor(readonly talentService: TalentService) {}

  @Get()
  findAll() {
    return this.talentService.findAll();
  }
}

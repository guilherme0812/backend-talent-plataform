import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { TalentService } from './talent.service';
import { CreateTalentDto } from './dto/talent.dto';

@Controller('talents')
export class TalentController {
  constructor(readonly talentService: TalentService) {}

  @Get()
  findAll() {
    return this.talentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.talentService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTalentDto) {
    return this.talentService.create(dto);
  }
}

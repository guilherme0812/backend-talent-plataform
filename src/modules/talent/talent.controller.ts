import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TalentService } from './talent.service';
import { CreateTalentDto } from './dto/talent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
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

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateTalentDto) {
    return this.talentService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.talentService.remove(id);
  }
}

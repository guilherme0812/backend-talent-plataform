import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Talent } from './entities/talent.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TalentService {
  constructor(
    @InjectRepository(Talent)
    private readonly repo: Repository<Talent>,
  ) {}

  findAll(): Promise<Talent[]> {
    return this.repo.find();
  }
}

import { ConflictException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Talent } from './entities/talent.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTalentDto } from './dto/talent.dto';

@Injectable()
export class TalentService {
  constructor(
    @InjectRepository(Talent)
    private readonly repo: Repository<Talent>,
  ) {}

  async findAll(): Promise<Talent[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<Talent> {
    const talent = await this.repo.findOneBy({ id });
    if (!talent) throw new ConflictException('Talent not found');
    return talent;
  }

  async create(dto: CreateTalentDto): Promise<Talent> {
    const exist = await this.repo.findOne({ where: { email: dto.email } });
    if (exist) throw new ConflictException('Email already exists');

    const talent = this.repo.create({
      ...dto,
      skills: dto.skills ?? [],
      isAvailable: dto.isAvailable ?? true,
    });
    return this.repo.save(talent);
  }
}

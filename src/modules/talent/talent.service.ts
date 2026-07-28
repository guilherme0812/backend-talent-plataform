import { ConflictException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Talent } from './entities/talent.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTalentDto, UpdateTalentDto } from './dto/talent.dto';
import { EmbeddingsService } from '../embeddings/embeddings.service';

@Injectable()
export class TalentService {
  constructor(
    @InjectRepository(Talent)
    private readonly repo: Repository<Talent>,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  async findAll(): Promise<Talent[]> {
    return this.repo.find();
  }

  async searchSimilar(text: string) {
    const vector = await this.embeddingsService.embedText(text);

    if (vector.length === 0) {
      throw new ConflictException('Failed to generate embedding for the provided text');
    }

    const results = await this.embeddingsService.searchSimilar(vector, 10, 0.1);
    return results;
  }

  async findOne(id: string): Promise<Talent> {
    const talent = await this.repo.findOneBy({ id });
    if (!talent) throw new ConflictException('Talent not found');
    return talent;
  }

  async findByEmail(email: string): Promise<Talent | null> {
    return this.repo.findOneBy({ email });
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

  async update(id: string, dto: UpdateTalentDto): Promise<Talent> {
    const talent = await this.findOne(id);
    Object.assign(talent, dto);
    return this.repo.save(talent);
  }

  async remove(id: string): Promise<void> {
    const exist = await this.findOne(id);
    if (!exist) throw new ConflictException('Talent not found');
    await this.repo.delete(id);
  }
}

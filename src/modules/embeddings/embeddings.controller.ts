import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { SearchSimilarDto } from './dto/embeedings.dto';
import { EmbeddingsService } from './embeddings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export interface SimilarityResult {
  id: string;
  name: string;
  email: string;
  bio?: string;
  skills: string[];
  similarity: number;
}

@UseGuards(JwtAuthGuard)
@Controller('embeddings')
export class EmbeddingsController {
  constructor(private readonly embeddingsService: EmbeddingsService) {}

  @Post('search')
  @HttpCode(HttpStatus.OK)
  async search(@Body() body: SearchSimilarDto) {
    const result = await this.embeddingsService.searchSimilar(body.vector, 10, 7);
    return result;
  }

  @Post('embed-text')
  @HttpCode(HttpStatus.OK)
  async embedQuery(@Body() body: { text: string }) {
    const result = await this.embeddingsService.embedQuery(body.text);
    return result;
  }

  @Post('index')
  @HttpCode(HttpStatus.NO_CONTENT)
  async createIndex(): Promise<void> {}
}

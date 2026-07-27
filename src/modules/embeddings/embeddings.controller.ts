import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { SaveEmbeddingDto, SearchSimilarDto } from './dto/embeedings.dto';
import { EmbeddingsService } from './embeddings.service';

export interface SimilarityResult {
  id: string;
  name: string;
  email: string;
  bio?: string;
  skills: string[];
  similarity: number;
}

@Controller('embeddings')
export class EmbeddingsController {
  constructor(private readonly embeddingsService: EmbeddingsService) {}

  @Post('talent/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async saveEmbeeding(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SaveEmbeddingDto) {
    await this.embeddingsService.saveEmbedding(id, dto.vector);
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  async search(@Body() body: SearchSimilarDto) {
    const result = await this.embeddingsService.searchSimilar(body.vector, 10, 0);
    return result;
  }

  @Post('embed-text')
  @HttpCode(HttpStatus.OK)
  async embedText(@Body() body: { text: string }) {
    const result = await this.embeddingsService.embedText(body.text);
    return result;
  }

  @Post('index')
  @HttpCode(HttpStatus.NO_CONTENT)
  async createIndex(): Promise<void> {}
}

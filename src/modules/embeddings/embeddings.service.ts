import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Talent } from '../talent/entities/talent.entity';
import { Repository } from 'typeorm/browser/repository/Repository.js';
import { DataSource } from 'typeorm';
import { SimilarityResult } from './embeddings.controller';
import { PDFParse } from 'pdf-parse';
import { Ollama } from 'ollama';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private readonly ollama: Ollama;
  private readonly ollamaModel: string;

  constructor(
    @InjectRepository(Talent)
    private readonly talentRepo: Repository<Talent>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {
    this.ollama = new Ollama({
      host: this.config.get('OLLAMA_URL', 'http://localhost:11434'),
    });
    this.ollamaModel = this.config.get('OLLAMA_EMBED_MODEL', 'nomic-embed-text');
  }

  async generateEmbeddingfromFile(file: Express.Multer.File, talentId: string) {
    const text = await this.extractTextFromFile(file);

    if (!text || text.trim().length === 0) {
      throw new BadRequestException('It was not possible to extract text from the uploaded file.');
    }

    const vector = await this.embedDocument(text);

    await this.saveEmbedding(talentId, vector);

    this.logger.log(`Embedding generated for talent ${talentId}`);
  }

  private async extractTextFromFile(file: Express.Multer.File): Promise<string> {
    const parser = new PDFParse({ data: file.buffer });
    const result = await parser.getText();

    return result.text;
  }

  async embedText(text: string): Promise<number[]> {
    try {
      const response = await this.ollama.embed({
        model: this.ollamaModel,
        input: text,
      });

      return response.embeddings[0]; // response.embeddings é number[][]
    } catch (error: any) {
      this.logger.error(`Erro ao gerar embedding via Ollama: ${error.message}`);
      throw new InternalServerErrorException('Erro ao gerar embedding via Ollama');
    }
  }

  async embedDocument(text: string): Promise<number[]> {
    return this.embedText(`search_document: ${text}`);
  }

  async embedQuery(text: string): Promise<number[]> {
    return this.embedText(`search_query: ${text}`);
  }

  async saveEmbedding(talentId: string, vector: number[]): Promise<void> {
    // if (vector.length !== 1536) {
    //   throw new Error(`Vetor deve ter 1536 dimensões, recebeu ${vector.length}`);
    // }
    // O casting "[...]::vector" é a sintaxe do pgvector
    const vectorStr = `[${vector.join(',')}]`;
    await this.dataSource.query(`UPDATE talents SET embedding = $1::vector WHERE id = $2`, [
      vectorStr,
      talentId,
    ]);
    this.logger.log(`Embedding salvo para talento ${talentId}`);
  }
  /**
   * Busca os N talentos mais similares usando distância cosseno (<=>).
   * Retorna ordenados por similaridade decrescente.
   *
   * @param queryVector - Vetor de consulta (mesmas 1536 dimensões)
   * @param topK        - Quantidade de resultados (padrão: 10)
   * @param threshold   - Similaridade mínima 0–1 (padrão: 0.7)
   */
  async searchSimilar(
    queryVector: number[],
    topK = 10,
    threshold = 0.7,
  ): Promise<SimilarityResult[]> {
    const vectorStr = `[${queryVector.join(',')}]`;
    /**
     * Distância cosseno via pgvector: (1 - embedding <=> query) = similaridade
     * IVFFlat index acelera a busca em grandes volumes.
     */
    const rows: SimilarityResult[] = await this.dataSource.query(
      `
      SELECT
        id,
        name,
        email,
        bio,
        skills,
        1 - (embedding <=> $1::vector) AS similarity
      FROM talents
      WHERE
        embedding IS NOT NULL
        AND is_available = true
        AND 1 - (embedding <=> $1::vector) >= $2
      ORDER BY embedding <=> $1::vector
      LIMIT $3
      `,
      [vectorStr, threshold, topK],
    );

    return rows;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Talent } from '../talent/entities/talent.entity';
import { Repository } from 'typeorm/browser/repository/Repository.js';
import { DataSource } from 'typeorm';
import { SimilarityResult } from './embeddings.controller';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);

  constructor(
    @InjectRepository(Talent)
    private readonly talentRepo: Repository<Talent>,
    private readonly dataSource: DataSource,
  ) {}

  async saveEmbedding(talentId: string, vector: number[]): Promise<void> {
    if (vector.length !== 1536) {
      throw new Error(`Vetor deve ter 1536 dimensões, recebeu ${vector.length}`);
    }
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

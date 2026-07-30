import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { DataSource } from 'typeorm';
import { SimilarityResult } from './embeddings.controller';
import { PDFParse } from 'pdf-parse';
import { Ollama } from 'ollama';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Talent } from '../talent/entities/talent.entity';

interface TextChunk {
  type: string; // 'summary' | 'experience' | 'skills' | 'education' | 'generic'
  text: string;
}

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private readonly ollama: Ollama;
  private readonly ollamaModel: string;

  constructor(
    @InjectRepository(Talent)
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

    const chunks = this.chunkText(text);

    if (chunks.length === 0) {
      throw new BadRequestException('Não foi possível dividir o currículo em chunks.');
    }

    await this.saveEmbeddingChunks(talentId, chunks);

    this.logger.log(`${chunks.length} embeddings gerados para talento ${talentId}`);
  }

  private chunkText(text: string): TextChunk[] {
    const sectionPatterns: { type: string; regex: RegExp }[] = [
      { type: 'experience', regex: /(experi[êe]ncia|experience|hist[óo]rico profissional)/i },
      { type: 'skills', regex: /(habilidades|skills|compet[êe]ncias|tecnologias)/i },
      { type: 'education', regex: /(forma[çc][ãa]o|education|escolaridade)/i },
      { type: 'summary', regex: /(resumo|summary|sobre mim|objetivo)/i },
    ];

    // Quebra o texto em linhas não vazias
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const chunks: TextChunk[] = [];
    let currentType = 'generic';
    let currentLines: string[] = [];

    const flush = () => {
      const joined = currentLines.join('\n').trim();
      if (joined.length > 0) {
        chunks.push({ type: currentType, text: joined });
      }
      currentLines = [];
    };

    for (const line of lines) {
      const matched = sectionPatterns.find((p) => p.regex.test(line));

      // Se a linha parece ser um cabeçalho de seção conhecida, fecha o chunk atual
      // e começa um novo
      if (matched && line.length < 60) {
        flush();
        currentType = matched.type;
        continue; // não inclui o próprio cabeçalho no corpo do chunk
      }

      currentLines.push(line);
    }
    flush();

    // Fallback: se não identificou nenhuma seção, chunka por tamanho fixo
    if (chunks.length <= 1) {
      return this.chunkByLength(text);
    }

    return chunks;
  }

  private chunkByLength(text: string, maxChars = 1000): TextChunk[] {
    const chunks: TextChunk[] = [];
    for (let i = 0; i < text.length; i += maxChars) {
      const slice = text.slice(i, i + maxChars).trim();
      if (slice.length > 0) {
        chunks.push({ type: 'generic', text: slice });
      }
    }
    return chunks;
  }

  private async extractTextFromFile(file: Express.Multer.File): Promise<string> {
    const parser = new PDFParse({ data: file.buffer });
    const result = await parser.getText();

    return result.text;
  }

  async embedDocument(text: string): Promise<number[]> {
    return this.embed(`search_document: ${text}`);
  }

  async embedQuery(text: string): Promise<number[]> {
    return this.embed(`search_query: ${text}`);
  }

  private async embed(text: string): Promise<number[]> {
    try {
      const response = await this.ollama.embed({
        model: this.ollamaModel,
        input: text,
      });

      return response.embeddings[0];
    } catch (error: any) {
      this.logger.error(`Erro ao gerar embedding via Ollama: ${error.message}`);
      throw new InternalServerErrorException('Erro ao gerar embedding via Ollama');
    }
  }

  private async saveEmbeddingChunks(talentId: string, chunks: TextChunk[]): Promise<void> {
    await this.dataSource.query(`DELETE FROM talent_embeddings WHERE talent_id = $1`, [talentId]);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const vector = await this.embedDocument(chunk.text);
      const vectorStr = `[${vector.join(',')}]`;

      await this.dataSource.query(
        `INSERT INTO talent_embeddings (talent_id, chunk_type, chunk_text, chunk_index, embedding)
         VALUES ($1, $2, $3, $4, $5::vector)`,
        [talentId, chunk.type, chunk.text, i, vectorStr],
      );
    }

    this.logger.log(`Embeddings salvos para talento ${talentId} (${chunks.length} chunks)`);
  }

  /**
   * Busca os N talentos mais similares usando distância cosseno (<=>).
   * Retorna ordenados por similaridade decrescente.
   *
   * @param queryVector - Vetor de consulta (mesmas 1536 dimensões)
   * @param topK        - Quantidade de resultados (padrão: 10)
   * @param threshold   - Similaridade mínima 0–1 (padrão: 0.7)
   */
  // async searchSimilar(
  //   queryVector: number[],
  //   topK = 10,
  //   threshold = 0.7,
  // ): Promise<SimilarityResult[]> {
  //   const vectorStr = `[${queryVector.join(',')}]`;

  //   const rows: SimilarityResult[] = await this.dataSource.query(
  //     `
  //     SELECT
  //       id,
  //       name,
  //       email,
  //       bio,
  //       skills,
  //       1 - (embedding <=> $1::vector) AS similarity
  //     FROM talents
  //     WHERE
  //       embedding IS NOT NULL
  //       AND is_available = true
  //       AND 1 - (embedding <=> $1::vector) >= $2
  //     ORDER BY embedding <=> $1::vector
  //     LIMIT $3
  //     `,
  //     [vectorStr, threshold, topK],
  //   );

  //   return rows;
  // }

  async searchSimilar(
    queryVector: number[],
    topK = 10,
    threshold = 0.7,
  ): Promise<SimilarityResult[]> {
    const vectorStr = `[${queryVector.join(',')}]`;

    const rows: SimilarityResult[] = await this.dataSource.query(
      `
      SELECT DISTINCT ON (t.id)
        t.id,
        t.name,
        t.email,
        t.bio,
        t.skills,
        te.chunk_type,
        te.chunk_text,
        1 - (te.embedding <=> $1::vector) AS similarity
      FROM talent_embeddings te
      JOIN talents t ON t.id = te.talent_id
      WHERE
        t.is_available = true
        AND 1 - (te.embedding <=> $1::vector) >= $2
      ORDER BY t.id, te.embedding <=> $1::vector
      `,
      [vectorStr, threshold],
    );

    // DISTINCT ON já traz o melhor chunk por talento, mas não respeita LIMIT/ORDER
    // final por similaridade — então ordenamos e limitamos na aplicação.
    return rows.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
  }
}

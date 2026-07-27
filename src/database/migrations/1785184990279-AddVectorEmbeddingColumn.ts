// src/migrations/1234567890123-AddVectorEmbeddingColumn.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVectorEmbeddingColumn1234567890123 implements MigrationInterface {
  name = 'AddVectorEmbeddingColumn1234567890123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Garante que a extensão pgvector está habilitada
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector;`);

    // 2. Converte a coluna embedding de text para vector(768)
    await queryRunner.query(`
      ALTER TABLE talents 
      ALTER COLUMN embedding TYPE vector(768) 
      USING embedding::vector(768);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverte: volta a coluna para text
    await queryRunner.query(`
      ALTER TABLE talents 
      ALTER COLUMN embedding TYPE text 
      USING embedding::text;
    `);
  }
}

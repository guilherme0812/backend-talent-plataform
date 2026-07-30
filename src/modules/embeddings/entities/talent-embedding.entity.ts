// src/embeddings/entities/talent-embedding.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  ValueTransformer,
} from 'typeorm';
import { Talent } from '../../talent/entities/talent.entity';

export type ChunkType = 'summary' | 'experience' | 'skills' | 'education' | 'generic' | 'full';

const vectorTransformer: ValueTransformer = {
  to: (value: number[] | null): string | null => {
    if (!value) return null;
    return `[${value.join(',')}]`;
  },
  from: (value: string | null): number[] | null => {
    if (!value) return null;
    return value
      .slice(1, -1)
      .split(',')
      .map((n) => parseFloat(n));
  },
};

@Entity('talent_embeddings')
export class TalentEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index() // índice direto no campo, sem ambiguidade
  @Column({ name: 'talent_id', type: 'uuid' })
  talentId: string;

  @ManyToOne(() => Talent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'talent_id' })
  talent: Talent;

  @Column({ name: 'chunk_type', type: 'varchar', length: 50, nullable: true })
  chunkType: ChunkType | null;

  @Column({ name: 'chunk_text', type: 'text' })
  chunkText: string;

  @Column({ name: 'chunk_index', type: 'int', default: 0 })
  chunkIndex: number;

  @Column({
    type: 'vector',
    length: 768,
    transformer: vectorTransformer,
  })
  embedding: number[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}

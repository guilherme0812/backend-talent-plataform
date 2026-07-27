import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('talents')
export class Talent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ length: 500 })
  bio: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({
    nullable: true,
  })
  resumeUrl: string;

  @Column('text', { array: true, default: [] })
  skills: string[];

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  linkedInUrl?: string;

  @Column({ nullable: true })
  githubUrl?: string;

  @Column({ nullable: true, type: 'int' })
  yearsOfExperience?: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  expectedSalary?: number;

  @Column({ default: true })
  isAvailable: boolean;

  /**
   * Vetor de embedding gerado a partir do bio + skills.
   * Armazenado como vector(1536) no PostgreSQL via pgvector.
   * Usado para busca semântica (similarity search).
   *
   * Tipo "simple-array" aqui é um workaround — o TypeORM não
   * tem tipo nativo para "vector". A coluna real é criada via
   * migration SQL pura (veja CreateTalentEmbedding migration).
   */
  @Column({
    type: 'text',
    nullable: true,
    select: false, // Não seleciona por padrão para evitar overhead
    comment: 'Embedding vetorial (pgvector vector(1536))',
  })
  embedding?: string;

  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

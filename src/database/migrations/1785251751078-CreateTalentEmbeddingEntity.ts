import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTalentEmbeddingEntity1785251751078 implements MigrationInterface {
    name = 'CreateTalentEmbeddingEntity1785251751078'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "talent_embeddings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "talent_id" uuid NOT NULL, "chunk_type" character varying(50), "chunk_text" text NOT NULL, "chunk_index" integer NOT NULL DEFAULT '0', "embedding" vector(768) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6f45d5157b045e25b5d7f6c057e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0d32aedbd04cae5e13a16a4c68" ON "talent_embeddings"  ("talent_id") `);
        await queryRunner.query(`ALTER TABLE "talent_embeddings" ADD CONSTRAINT "FK_0d32aedbd04cae5e13a16a4c68d" FOREIGN KEY ("talent_id") REFERENCES "talents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "talent_embeddings" DROP CONSTRAINT "FK_0d32aedbd04cae5e13a16a4c68d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0d32aedbd04cae5e13a16a4c68"`);
        await queryRunner.query(`DROP TABLE "talent_embeddings"`);
    }

}

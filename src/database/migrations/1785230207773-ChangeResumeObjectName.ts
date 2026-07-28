import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeResumeObjectName1785230207773 implements MigrationInterface {
    name = 'ChangeResumeObjectName1785230207773'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "talents" DROP COLUMN "resumeUrl"`);
        await queryRunner.query(`ALTER TABLE "talents" ADD "resumeObjectName" character varying`);
        await queryRunner.query(`ALTER TABLE "talents" DROP COLUMN "embedding"`);
        await queryRunner.query(`ALTER TABLE "talents" ADD "embedding" text`);
        await queryRunner.query(`COMMENT ON COLUMN "talents"."embedding" IS 'Embedding vetorial (pgvector vector(1536))'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON COLUMN "talents"."embedding" IS 'Embedding vetorial (pgvector vector(1536))'`);
        await queryRunner.query(`ALTER TABLE "talents" DROP COLUMN "embedding"`);
        await queryRunner.query(`ALTER TABLE "talents" ADD "embedding" vector(768)`);
        await queryRunner.query(`ALTER TABLE "talents" DROP COLUMN "resumeObjectName"`);
        await queryRunner.query(`ALTER TABLE "talents" ADD "resumeUrl" character varying`);
    }

}

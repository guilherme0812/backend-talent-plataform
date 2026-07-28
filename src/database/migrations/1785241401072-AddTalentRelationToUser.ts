import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTalentRelationToUser1785241401072 implements MigrationInterface {
    name = 'AddTalentRelationToUser1785241401072'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "talentId" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_52edbd83395f9d2fa81fca794f8" UNIQUE ("talentId")`);
        await queryRunner.query(`ALTER TABLE "talents" DROP COLUMN "embedding"`);
        await queryRunner.query(`ALTER TABLE "talents" ADD "embedding" text`);
        await queryRunner.query(`COMMENT ON COLUMN "talents"."embedding" IS 'Embedding vetorial (pgvector vector(1536))'`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_52edbd83395f9d2fa81fca794f8" FOREIGN KEY ("talentId") REFERENCES "talents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_52edbd83395f9d2fa81fca794f8"`);
        await queryRunner.query(`COMMENT ON COLUMN "talents"."embedding" IS 'Embedding vetorial (pgvector vector(1536))'`);
        await queryRunner.query(`ALTER TABLE "talents" DROP COLUMN "embedding"`);
        await queryRunner.query(`ALTER TABLE "talents" ADD "embedding" vector`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_52edbd83395f9d2fa81fca794f8"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "talentId"`);
    }

}

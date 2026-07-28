import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeIsAvailableName1785242890384 implements MigrationInterface {
  name = 'ChangeIsAvailableName1785242890384';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "talents" RENAME COLUMN "isAvailable" TO "is_available"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "talents" RENAME COLUMN "is_available" TO "isAvailable"`);
  }
}

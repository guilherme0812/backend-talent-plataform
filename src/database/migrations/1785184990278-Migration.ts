import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1785184990278 implements MigrationInterface {
    name = 'Migration1785184990278'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "talents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(120) NOT NULL, "email" character varying NOT NULL, "bio" character varying(500) NOT NULL, "avatarUrl" character varying, "resumeUrl" character varying, "skills" text array NOT NULL DEFAULT '{}', "location" character varying, "linkedInUrl" character varying, "githubUrl" character varying, "yearsOfExperience" integer, "expectedSalary" numeric(10,2), "isAvailable" boolean NOT NULL DEFAULT true, "embedding" text, "createAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_df642d41066a51df94b83d797cd" UNIQUE ("email"), CONSTRAINT "PK_8cecf07c0d624cc503d6a36df52" PRIMARY KEY ("id")); COMMENT ON COLUMN "talents"."embedding" IS 'Embedding vetorial (pgvector vector(1536))'`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'talent', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "talents"`);
    }

}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPoliticalParties1790477200000 implements MigrationInterface {
  name = 'AddPoliticalParties1790477200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "political_parties" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(180) NOT NULL,
        "abbreviation" character varying(30) NOT NULL,
        "logo_url" text,
        "status" character varying(30) NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_political_parties_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_political_parties_abbreviation"
      ON "political_parties" ("abbreviation")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."UQ_political_parties_abbreviation"
    `);

    await queryRunner.query(`
      DROP TABLE "political_parties"
    `);
  }
}

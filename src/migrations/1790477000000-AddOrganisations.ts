import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganisations1790477000000 implements MigrationInterface {
  name = 'AddOrganisations1790477000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "organisations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(180) NOT NULL,
        "slug" character varying(180) NOT NULL,
        "status" character varying(30) NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_organisations_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_organisations_slug"
      ON "organisations" ("slug")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_organisations_slug"
    `);

    await queryRunner.query(`
      DROP TABLE "organisations"
    `);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganisationPoliticalParties1790477300000 implements MigrationInterface {
  name = 'AddOrganisationPoliticalParties1790477300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "organisation_political_parties" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organisation_id" uuid NOT NULL,
        "political_party_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_organisation_political_parties_id"
          PRIMARY KEY ("id"),
        CONSTRAINT "FK_organisation_political_parties_organisation"
          FOREIGN KEY ("organisation_id")
          REFERENCES "organisations"("id")
          ON DELETE RESTRICT,
        CONSTRAINT "FK_organisation_political_parties_party"
          FOREIGN KEY ("political_party_id")
          REFERENCES "political_parties"("id")
          ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_organisation_political_parties_org_party"
      ON "organisation_political_parties"
      ("organisation_id", "political_party_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_organisation_political_parties_organisation"
      ON "organisation_political_parties" ("organisation_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_organisation_political_parties_party"
      ON "organisation_political_parties" ("political_party_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_organisation_political_parties_party"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_organisation_political_parties_organisation"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."UQ_organisation_political_parties_org_party"
    `);

    await queryRunner.query(`
      DROP TABLE "organisation_political_parties"
    `);
  }
}

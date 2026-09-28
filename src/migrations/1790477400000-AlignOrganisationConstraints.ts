import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignOrganisationConstraints1790477400000 implements MigrationInterface {
  name = 'AlignOrganisationConstraints1790477400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Align organisation_memberships foreign-key names with TypeORM.
    await queryRunner.query(`
      ALTER TABLE "organisation_memberships"
      RENAME CONSTRAINT "FK_organisation_memberships_organisation"
      TO "FK_9635442addd2ae591c3d2c01b13"
    `);

    await queryRunner.query(`
      ALTER TABLE "organisation_memberships"
      RENAME CONSTRAINT "FK_organisation_memberships_user"
      TO "FK_72bdc2e7ec09a8e892fd96420b2"
    `);

    await queryRunner.query(`
      ALTER TABLE "organisation_memberships"
      RENAME CONSTRAINT "FK_organisation_memberships_role"
      TO "FK_d73c652bbeca7a89699441983c4"
    `);

    await queryRunner.query(`
      ALTER TABLE "organisation_memberships"
      RENAME CONSTRAINT "FK_organisation_memberships_manager"
      TO "FK_ca5ff9484b406e9de7a3e29154b"
    `);

    // Align organisation_political_parties foreign-key names with TypeORM.
    await queryRunner.query(`
      ALTER TABLE "organisation_political_parties"
      RENAME CONSTRAINT "FK_organisation_political_parties_organisation"
      TO "FK_c4f26daec14b06a144fd8293153"
    `);

    await queryRunner.query(`
      ALTER TABLE "organisation_political_parties"
      RENAME CONSTRAINT "FK_organisation_political_parties_party"
      TO "FK_fe480f92dbf76c28c09e3fe3c86"
    `);

    // TypeORM expects a table-level UNIQUE constraint rather than
    // a standalone unique index for this entity.
    await queryRunner.query(`
      DROP INDEX "public"."UQ_organisation_political_parties_org_party"
    `);

    await queryRunner.query(`
      ALTER TABLE "organisation_political_parties"
      ADD CONSTRAINT "UQ_organisation_political_parties_org_party"
      UNIQUE ("organisation_id", "political_party_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organisation_political_parties"
      DROP CONSTRAINT "UQ_organisation_political_parties_org_party"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_organisation_political_parties_org_party"
      ON "organisation_political_parties"
      ("organisation_id", "political_party_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "organisation_political_parties"
      RENAME CONSTRAINT "FK_fe480f92dbf76c28c09e3fe3c86"
      TO "FK_organisation_political_parties_party"
    `);

    await queryRunner.query(`
      ALTER TABLE "organisation_political_parties"
      RENAME CONSTRAINT "FK_c4f26daec14b06a144fd8293153"
      TO "FK_organisation_political_parties_organisation"
    `);

    await queryRunner.query(`
      ALTER TABLE "organisation_memberships"
      RENAME CONSTRAINT "FK_ca5ff9484b406e9de7a3e29154b"
      TO "FK_organisation_memberships_manager"
    `);

    await queryRunner.query(`
      ALTER TABLE "organisation_memberships"
      RENAME CONSTRAINT "FK_d73c652bbeca7a89699441983c4"
      TO "FK_organisation_memberships_role"
    `);

    await queryRunner.query(`
      ALTER TABLE "organisation_memberships"
      RENAME CONSTRAINT "FK_72bdc2e7ec09a8e892fd96420b2"
      TO "FK_organisation_memberships_user"
    `);

    await queryRunner.query(`
      ALTER TABLE "organisation_memberships"
      RENAME CONSTRAINT "FK_9635442addd2ae591c3d2c01b13"
      TO "FK_organisation_memberships_organisation"
    `);
  }
}

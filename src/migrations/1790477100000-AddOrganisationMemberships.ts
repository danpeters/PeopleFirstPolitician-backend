import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganisationMemberships1790477100000 implements MigrationInterface {
  name = 'AddOrganisationMemberships1790477100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "organisation_memberships" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organisation_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        "status" character varying(30) NOT NULL DEFAULT 'active',
        "manager_membership_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_organisation_memberships_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_organisation_memberships_organisation"
          FOREIGN KEY ("organisation_id")
          REFERENCES "organisations"("id")
          ON DELETE RESTRICT,
        CONSTRAINT "FK_organisation_memberships_user"
          FOREIGN KEY ("user_id")
          REFERENCES "users"("id")
          ON DELETE RESTRICT,
        CONSTRAINT "FK_organisation_memberships_role"
          FOREIGN KEY ("role_id")
          REFERENCES "roles"("id")
          ON DELETE RESTRICT,
        CONSTRAINT "FK_organisation_memberships_manager"
          FOREIGN KEY ("manager_membership_id")
          REFERENCES "organisation_memberships"("id")
          ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_organisation_memberships_organisation_user"
      ON "organisation_memberships" ("organisation_id", "user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_organisation_memberships_organisation"
      ON "organisation_memberships" ("organisation_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_organisation_memberships_user"
      ON "organisation_memberships" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_organisation_memberships_user"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_organisation_memberships_organisation"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."UQ_organisation_memberships_organisation_user"
    `);

    await queryRunner.query(`
      DROP TABLE "organisation_memberships"
    `);
  }
}

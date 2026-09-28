import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCampaign1790521919582 implements MigrationInterface {
    name = 'AddCampaign1790521919582'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."campaigns_status_enum" AS ENUM('draft', 'active', 'suspended', 'completed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "campaigns" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "candidacy_id" uuid NOT NULL, "organisation_id" uuid NOT NULL, "name" character varying(180) NOT NULL, "code" character varying(80) NOT NULL, "status" "public"."campaigns_status_enum" NOT NULL DEFAULT 'draft', "description" text, "start_date" date, "end_date" date, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_831e3fcd4fc45b4e4c3f57a9ee4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_campaigns_candidacy" ON "campaigns" ("candidacy_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_campaigns_status" ON "campaigns" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_campaigns_organisation" ON "campaigns" ("organisation_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_campaigns_code" ON "campaigns" ("code") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_campaigns_candidacy" ON "campaigns" ("candidacy_id") `);
        await queryRunner.query(`ALTER TABLE "campaigns" ADD CONSTRAINT "FK_e83cdc189af42e258b2d1725e0e" FOREIGN KEY ("candidacy_id") REFERENCES "candidacies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "campaigns" ADD CONSTRAINT "FK_b01ad04a4fc19c5680f244bbd17" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "campaigns" DROP CONSTRAINT "FK_b01ad04a4fc19c5680f244bbd17"`);
        await queryRunner.query(`ALTER TABLE "campaigns" DROP CONSTRAINT "FK_e83cdc189af42e258b2d1725e0e"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_campaigns_candidacy"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_campaigns_code"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_campaigns_organisation"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_campaigns_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_campaigns_candidacy"`);
        await queryRunner.query(`DROP TABLE "campaigns"`);
        await queryRunner.query(`DROP TYPE "public"."campaigns_status_enum"`);
    }

}

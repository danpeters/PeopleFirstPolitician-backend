import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCampaignMembership1790522873225 implements MigrationInterface {
    name = 'AddCampaignMembership1790522873225'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."campaign_memberships_role_enum" AS ENUM('campaign_manager', 'campaign_coordinator', 'field_coordinator', 'data_officer', 'member')`);
        await queryRunner.query(`CREATE TYPE "public"."campaign_memberships_status_enum" AS ENUM('active', 'suspended', 'inactive')`);
        await queryRunner.query(`CREATE TABLE "campaign_memberships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "campaign_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role" "public"."campaign_memberships_role_enum" NOT NULL DEFAULT 'member', "status" "public"."campaign_memberships_status_enum" NOT NULL DEFAULT 'active', "manager_membership_id" uuid, "joined_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_6f6dbdf3992e780af335d16de47" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_campaign_memberships_manager" ON "campaign_memberships" ("manager_membership_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_campaign_memberships_status" ON "campaign_memberships" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_campaign_memberships_role" ON "campaign_memberships" ("role") `);
        await queryRunner.query(`CREATE INDEX "IDX_campaign_memberships_user" ON "campaign_memberships" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_campaign_memberships_campaign" ON "campaign_memberships" ("campaign_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_campaign_memberships_campaign_user" ON "campaign_memberships" ("campaign_id", "user_id") `);
        await queryRunner.query(`ALTER TABLE "campaign_memberships" ADD CONSTRAINT "FK_2cfe0d1b3f37688ecfd0d46f33a" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "campaign_memberships" ADD CONSTRAINT "FK_d3bbd2789803bf190f9849ff19b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "campaign_memberships" ADD CONSTRAINT "FK_7f563d629f6e3be3ac837b6b754" FOREIGN KEY ("manager_membership_id") REFERENCES "campaign_memberships"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "campaign_memberships" DROP CONSTRAINT "FK_7f563d629f6e3be3ac837b6b754"`);
        await queryRunner.query(`ALTER TABLE "campaign_memberships" DROP CONSTRAINT "FK_d3bbd2789803bf190f9849ff19b"`);
        await queryRunner.query(`ALTER TABLE "campaign_memberships" DROP CONSTRAINT "FK_2cfe0d1b3f37688ecfd0d46f33a"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_campaign_memberships_campaign_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_campaign_memberships_campaign"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_campaign_memberships_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_campaign_memberships_role"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_campaign_memberships_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_campaign_memberships_manager"`);
        await queryRunner.query(`DROP TABLE "campaign_memberships"`);
        await queryRunner.query(`DROP TYPE "public"."campaign_memberships_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."campaign_memberships_role_enum"`);
    }

}

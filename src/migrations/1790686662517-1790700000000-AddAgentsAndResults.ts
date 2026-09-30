import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAgentsAndResults1790686662517 implements MigrationInterface {
    name = '1790700000000AddAgentsAndResults1790686662517'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."agents_status_enum" AS ENUM('active', 'inactive', 'suspended')`);
        await queryRunner.query(`CREATE TABLE "agents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "user_id" uuid, "first_name" character varying(100) NOT NULL, "middle_name" character varying(100), "last_name" character varying(100) NOT NULL, "display_name" character varying(220) NOT NULL, "phone" character varying(30), "email" character varying(180), "photo_url" text, "photo_captured_at" TIMESTAMP, "photo_version" integer NOT NULL DEFAULT '1', "agent_reference" character varying(120), "identification_type" character varying(60), "identification_reference" character varying(180), "status" "public"."agents_status_enum" NOT NULL DEFAULT 'active', "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_9c653f28ae19c5884d5baf6a1d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_agents_organisation_reference" ON "agents" ("organisation_id", "agent_reference") WHERE "agent_reference" IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_agents_display_name" ON "agents" ("display_name") `);
        await queryRunner.query(`CREATE INDEX "IDX_agents_status" ON "agents" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_agents_user" ON "agents" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_agents_organisation" ON "agents" ("organisation_id") `);
        await queryRunner.query(`CREATE TYPE "public"."agent_assignments_status_enum" AS ENUM('active', 'suspended', 'ended')`);
        await queryRunner.query(`CREATE TABLE "agent_assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "agent_id" uuid NOT NULL, "campaign_id" uuid NOT NULL, "polling_unit_id" uuid NOT NULL, "status" "public"."agent_assignments_status_enum" NOT NULL DEFAULT 'active', "assigned_at" TIMESTAMP, "unassigned_at" TIMESTAMP, "assigned_by_user_id" uuid NOT NULL, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_b6e27b10541d99d93d8f9ec560a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_agent_assignments_assigned_by" ON "agent_assignments" ("assigned_by_user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_agent_assignments_status" ON "agent_assignments" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_agent_assignments_polling_unit" ON "agent_assignments" ("polling_unit_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_agent_assignments_campaign" ON "agent_assignments" ("campaign_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_agent_assignments_agent" ON "agent_assignments" ("agent_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_agent_assignments_agent_campaign_polling_unit" ON "agent_assignments" ("agent_id", "campaign_id", "polling_unit_id") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE TYPE "public"."polling_unit_results_status_enum" AS ENUM('draft', 'submitted', 'synchronized', 'flagged', 'verified')`);
        await queryRunner.query(`CREATE TABLE "polling_unit_results" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "client_reference" character varying(120) NOT NULL, "election_id" uuid NOT NULL, "election_race_id" uuid NOT NULL, "polling_unit_id" uuid NOT NULL, "agent_assignment_id" uuid NOT NULL, "submitted_by_user_id" uuid NOT NULL, "status" "public"."polling_unit_results_status_enum" NOT NULL DEFAULT 'draft', "submitted_at" TIMESTAMP, "synchronized_at" TIMESTAMP, "verified_at" TIMESTAMP, "verified_by_user_id" uuid, "flagged_at" TIMESTAMP, "flagged_by_user_id" uuid, "flag_reason" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_ff730cf2ea0b4a89d9824d0b081" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_polling_unit_results_verified_by" ON "polling_unit_results" ("verified_by_user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_polling_unit_results_status" ON "polling_unit_results" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_polling_unit_results_submitter" ON "polling_unit_results" ("submitted_by_user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_polling_unit_results_assignment" ON "polling_unit_results" ("agent_assignment_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_polling_unit_results_polling_unit" ON "polling_unit_results" ("polling_unit_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_polling_unit_results_race" ON "polling_unit_results" ("election_race_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_polling_unit_results_election" ON "polling_unit_results" ("election_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_polling_unit_results_client_reference" ON "polling_unit_results" ("client_reference") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_polling_unit_results_race_polling_unit" ON "polling_unit_results" ("election_race_id", "polling_unit_id") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE TABLE "polling_unit_result_votes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "polling_unit_result_id" uuid NOT NULL, "candidacy_id" uuid NOT NULL, "votes" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "CHK_polling_unit_result_votes_non_negative" CHECK ("votes" >= 0), CONSTRAINT "PK_53c7515c6b68fa607c6d9ceb83c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_polling_unit_result_votes_candidacy" ON "polling_unit_result_votes" ("candidacy_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_polling_unit_result_votes_result" ON "polling_unit_result_votes" ("polling_unit_result_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_polling_unit_result_votes_result_candidacy" ON "polling_unit_result_votes" ("polling_unit_result_id", "candidacy_id") `);
        await queryRunner.query(`CREATE TYPE "public"."result_evidence_evidence_type_enum" AS ENUM('result_sheet_photo', 'result_sheet_scan', 'supporting_document')`);
        await queryRunner.query(`CREATE TABLE "result_evidence" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "polling_unit_result_id" uuid NOT NULL, "evidence_type" "public"."result_evidence_evidence_type_enum" NOT NULL, "file_name" character varying(255) NOT NULL, "storage_key" text NOT NULL, "mime_type" character varying(120) NOT NULL, "file_size" bigint NOT NULL, "file_hash" character varying(128) NOT NULL, "uploaded_by_user_id" uuid NOT NULL, "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9fc1deb04e6c577810327c7e6d3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_result_evidence_type" ON "result_evidence" ("evidence_type") `);
        await queryRunner.query(`CREATE INDEX "IDX_result_evidence_uploaded_by" ON "result_evidence" ("uploaded_by_user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_result_evidence_result" ON "result_evidence" ("polling_unit_result_id") `);
        await queryRunner.query(`ALTER TABLE "agents" ADD CONSTRAINT "FK_acb00aa3f73422c7dca87ea906d" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "agents" ADD CONSTRAINT "FK_57ee94c84a8e570e362af59dcea" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "agent_assignments" ADD CONSTRAINT "FK_57bd00cd38a5e073c0a3f66cae3" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "agent_assignments" ADD CONSTRAINT "FK_7273f92077d163e1c1aa3546057" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "agent_assignments" ADD CONSTRAINT "FK_313f7802b72ceb1da84680f3409" FOREIGN KEY ("polling_unit_id") REFERENCES "polling_units"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "agent_assignments" ADD CONSTRAINT "FK_44b360694c11657564e5e8b0d34" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "polling_unit_results" ADD CONSTRAINT "FK_d3b970f52eb8b17751f9165e5ad" FOREIGN KEY ("election_id") REFERENCES "elections"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "polling_unit_results" ADD CONSTRAINT "FK_22ecf22413ce5f7dfbbe21a227a" FOREIGN KEY ("election_race_id") REFERENCES "election_races"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "polling_unit_results" ADD CONSTRAINT "FK_62e868394ee181afd4502be0b60" FOREIGN KEY ("polling_unit_id") REFERENCES "polling_units"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "polling_unit_results" ADD CONSTRAINT "FK_9c49cabd32c2b35f8d6f23a7a0a" FOREIGN KEY ("agent_assignment_id") REFERENCES "agent_assignments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "polling_unit_results" ADD CONSTRAINT "FK_d5b5e660e043cd01f4bb4fc4090" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "polling_unit_results" ADD CONSTRAINT "FK_2b2bec4b2b3addbd137397bc68a" FOREIGN KEY ("verified_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "polling_unit_results" ADD CONSTRAINT "FK_555693371a9377e8e5775928637" FOREIGN KEY ("flagged_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "polling_unit_result_votes" ADD CONSTRAINT "FK_3a8174f15877604085cc8d1b4ce" FOREIGN KEY ("polling_unit_result_id") REFERENCES "polling_unit_results"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "polling_unit_result_votes" ADD CONSTRAINT "FK_473c405bdbf10325feb225fc866" FOREIGN KEY ("candidacy_id") REFERENCES "candidacies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "result_evidence" ADD CONSTRAINT "FK_6a7ca8c93e4569b106e4fdf2e06" FOREIGN KEY ("polling_unit_result_id") REFERENCES "polling_unit_results"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "result_evidence" ADD CONSTRAINT "FK_7ff9597f1d02d6de3436249b605" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "result_evidence" DROP CONSTRAINT "FK_7ff9597f1d02d6de3436249b605"`);
        await queryRunner.query(`ALTER TABLE "result_evidence" DROP CONSTRAINT "FK_6a7ca8c93e4569b106e4fdf2e06"`);
        await queryRunner.query(`ALTER TABLE "polling_unit_result_votes" DROP CONSTRAINT "FK_473c405bdbf10325feb225fc866"`);
        await queryRunner.query(`ALTER TABLE "polling_unit_result_votes" DROP CONSTRAINT "FK_3a8174f15877604085cc8d1b4ce"`);
        await queryRunner.query(`ALTER TABLE "polling_unit_results" DROP CONSTRAINT "FK_555693371a9377e8e5775928637"`);
        await queryRunner.query(`ALTER TABLE "polling_unit_results" DROP CONSTRAINT "FK_2b2bec4b2b3addbd137397bc68a"`);
        await queryRunner.query(`ALTER TABLE "polling_unit_results" DROP CONSTRAINT "FK_d5b5e660e043cd01f4bb4fc4090"`);
        await queryRunner.query(`ALTER TABLE "polling_unit_results" DROP CONSTRAINT "FK_9c49cabd32c2b35f8d6f23a7a0a"`);
        await queryRunner.query(`ALTER TABLE "polling_unit_results" DROP CONSTRAINT "FK_62e868394ee181afd4502be0b60"`);
        await queryRunner.query(`ALTER TABLE "polling_unit_results" DROP CONSTRAINT "FK_22ecf22413ce5f7dfbbe21a227a"`);
        await queryRunner.query(`ALTER TABLE "polling_unit_results" DROP CONSTRAINT "FK_d3b970f52eb8b17751f9165e5ad"`);
        await queryRunner.query(`ALTER TABLE "agent_assignments" DROP CONSTRAINT "FK_44b360694c11657564e5e8b0d34"`);
        await queryRunner.query(`ALTER TABLE "agent_assignments" DROP CONSTRAINT "FK_313f7802b72ceb1da84680f3409"`);
        await queryRunner.query(`ALTER TABLE "agent_assignments" DROP CONSTRAINT "FK_7273f92077d163e1c1aa3546057"`);
        await queryRunner.query(`ALTER TABLE "agent_assignments" DROP CONSTRAINT "FK_57bd00cd38a5e073c0a3f66cae3"`);
        await queryRunner.query(`ALTER TABLE "agents" DROP CONSTRAINT "FK_57ee94c84a8e570e362af59dcea"`);
        await queryRunner.query(`ALTER TABLE "agents" DROP CONSTRAINT "FK_acb00aa3f73422c7dca87ea906d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_result_evidence_result"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_result_evidence_uploaded_by"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_result_evidence_type"`);
        await queryRunner.query(`DROP TABLE "result_evidence"`);
        await queryRunner.query(`DROP TYPE "public"."result_evidence_evidence_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_polling_unit_result_votes_result_candidacy"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_polling_unit_result_votes_result"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_polling_unit_result_votes_candidacy"`);
        await queryRunner.query(`DROP TABLE "polling_unit_result_votes"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_polling_unit_results_race_polling_unit"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_polling_unit_results_client_reference"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_polling_unit_results_election"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_polling_unit_results_race"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_polling_unit_results_polling_unit"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_polling_unit_results_assignment"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_polling_unit_results_submitter"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_polling_unit_results_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_polling_unit_results_verified_by"`);
        await queryRunner.query(`DROP TABLE "polling_unit_results"`);
        await queryRunner.query(`DROP TYPE "public"."polling_unit_results_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_agent_assignments_agent_campaign_polling_unit"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_agent_assignments_agent"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_agent_assignments_campaign"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_agent_assignments_polling_unit"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_agent_assignments_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_agent_assignments_assigned_by"`);
        await queryRunner.query(`DROP TABLE "agent_assignments"`);
        await queryRunner.query(`DROP TYPE "public"."agent_assignments_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_agents_organisation"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_agents_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_agents_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_agents_display_name"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_agents_organisation_reference"`);
        await queryRunner.query(`DROP TABLE "agents"`);
        await queryRunner.query(`DROP TYPE "public"."agents_status_enum"`);
    }

}

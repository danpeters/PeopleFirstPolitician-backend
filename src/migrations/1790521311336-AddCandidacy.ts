import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCandidacy1790521311336 implements MigrationInterface {
    name = 'AddCandidacy1790521311336'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."candidacies_status_enum" AS ENUM('draft', 'active', 'withdrawn', 'disqualified', 'completed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "candidacies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "candidate_id" uuid NOT NULL, "election_race_id" uuid NOT NULL, "political_party_id" uuid NOT NULL, "party_section_id" uuid, "status" "public"."candidacies_status_enum" NOT NULL DEFAULT 'draft', "nomination_reference" character varying(120), "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_95e088da89c4c9783a6aefc9964" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_candidacies_status" ON "candidacies" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_candidacies_party_section" ON "candidacies" ("party_section_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_candidacies_party" ON "candidacies" ("political_party_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_candidacies_race" ON "candidacies" ("election_race_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_candidacies_candidate" ON "candidacies" ("candidate_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_candidacies_party_race" ON "candidacies" ("political_party_id", "election_race_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_candidacies_candidate_race" ON "candidacies" ("candidate_id", "election_race_id") `);
        await queryRunner.query(`ALTER TABLE "candidacies" ADD CONSTRAINT "FK_432f57894521e250f13be27f612" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidacies" ADD CONSTRAINT "FK_602d3c75082be66ab528583ad43" FOREIGN KEY ("election_race_id") REFERENCES "election_races"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidacies" ADD CONSTRAINT "FK_8423a545b7269817b21a18e0d00" FOREIGN KEY ("political_party_id") REFERENCES "political_parties"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidacies" ADD CONSTRAINT "FK_bfdfd06755f20af625f9bbf4f0c" FOREIGN KEY ("party_section_id") REFERENCES "party_sections"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "candidacies" DROP CONSTRAINT "FK_bfdfd06755f20af625f9bbf4f0c"`);
        await queryRunner.query(`ALTER TABLE "candidacies" DROP CONSTRAINT "FK_8423a545b7269817b21a18e0d00"`);
        await queryRunner.query(`ALTER TABLE "candidacies" DROP CONSTRAINT "FK_602d3c75082be66ab528583ad43"`);
        await queryRunner.query(`ALTER TABLE "candidacies" DROP CONSTRAINT "FK_432f57894521e250f13be27f612"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_candidacies_candidate_race"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_candidacies_party_race"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_candidacies_candidate"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_candidacies_race"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_candidacies_party"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_candidacies_party_section"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_candidacies_status"`);
        await queryRunner.query(`DROP TABLE "candidacies"`);
        await queryRunner.query(`DROP TYPE "public"."candidacies_status_enum"`);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddElectionFoundation1790517801232 implements MigrationInterface {
    name = 'AddElectionFoundation1790517801232'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."party_sections_level_enum" AS ENUM('national', 'state', 'senatorial_district', 'federal_constituency', 'state_constituency', 'local_government', 'ward')`);
        await queryRunner.query(`CREATE TYPE "public"."party_sections_status_enum" AS ENUM('active', 'inactive')`);
        await queryRunner.query(`CREATE TABLE "party_sections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "political_party_id" uuid NOT NULL, "parent_section_id" uuid, "name" character varying(180) NOT NULL, "code" character varying(60), "level" "public"."party_sections_level_enum" NOT NULL, "status" "public"."party_sections_status_enum" NOT NULL DEFAULT 'active', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_9aeb49d0b48520147e2b0b68ca9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_party_sections_parent" ON "party_sections" ("parent_section_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_party_sections_party" ON "party_sections" ("political_party_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_party_sections_party_name" ON "party_sections" ("political_party_id", "name") `);
        await queryRunner.query(`CREATE TYPE "public"."elections_status_enum" AS ENUM('draft', 'active', 'completed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "elections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(180) NOT NULL, "election_type" character varying(60) NOT NULL, "election_date" date NOT NULL, "status" "public"."elections_status_enum" NOT NULL DEFAULT 'draft', "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_21abca6e4191b830d1eb8379cf0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_elections_election_date" ON "elections" ("election_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_elections_status" ON "elections" ("status") `);
        await queryRunner.query(`CREATE TABLE "election_positions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(60) NOT NULL, "name" character varying(120) NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_f7a7443d770280ed883c213327e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_election_positions_name" ON "election_positions" ("name") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_election_positions_code" ON "election_positions" ("code") `);
        await queryRunner.query(`CREATE TYPE "public"."electoral_scopes_scope_type_enum" AS ENUM('national', 'state', 'senatorial_district', 'federal_constituency', 'state_constituency', 'local_government', 'ward', 'polling_unit')`);
        await queryRunner.query(`CREATE TYPE "public"."electoral_scopes_status_enum" AS ENUM('active', 'inactive')`);
        await queryRunner.query(`CREATE TABLE "electoral_scopes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "scope_type" "public"."electoral_scopes_scope_type_enum" NOT NULL, "name" character varying(180) NOT NULL, "code" character varying(100), "status" "public"."electoral_scopes_status_enum" NOT NULL DEFAULT 'active', "state_id" uuid, "lga_id" uuid, "ward_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_1f0204586d0604d0e944a1d6ff0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_electoral_scopes_ward" ON "electoral_scopes" ("ward_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_electoral_scopes_lga" ON "electoral_scopes" ("lga_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_electoral_scopes_state" ON "electoral_scopes" ("state_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_electoral_scopes_type" ON "electoral_scopes" ("scope_type") `);
        await queryRunner.query(`CREATE TABLE "electoral_scope_polling_units" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "electoral_scope_id" uuid NOT NULL, "polling_unit_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_28a1a6c5cc51f498f25c4fec5f0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_electoral_scope_polling_units_polling_unit" ON "electoral_scope_polling_units" ("polling_unit_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_electoral_scope_polling_units_scope" ON "electoral_scope_polling_units" ("electoral_scope_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_electoral_scope_polling_units_scope_polling_unit" ON "electoral_scope_polling_units" ("electoral_scope_id", "polling_unit_id") `);
        await queryRunner.query(`ALTER TABLE "party_sections" ADD CONSTRAINT "FK_567e9348eba9e551e95871aca32" FOREIGN KEY ("political_party_id") REFERENCES "political_parties"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "party_sections" ADD CONSTRAINT "FK_6b8d9a07232bf77094cd07b4d95" FOREIGN KEY ("parent_section_id") REFERENCES "party_sections"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "electoral_scopes" ADD CONSTRAINT "FK_8a5e75234827beaf5f3bf6ff2fa" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "electoral_scopes" ADD CONSTRAINT "FK_406faa4afd26356e9a1200324ee" FOREIGN KEY ("lga_id") REFERENCES "lgas"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "electoral_scopes" ADD CONSTRAINT "FK_fc00c2492a2a3ea6cb4e6692458" FOREIGN KEY ("ward_id") REFERENCES "wards"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "electoral_scope_polling_units" ADD CONSTRAINT "FK_cec1b75eac4772e6244e5007cec" FOREIGN KEY ("electoral_scope_id") REFERENCES "electoral_scopes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "electoral_scope_polling_units" ADD CONSTRAINT "FK_43e8df6a282c333d22e48ab70a8" FOREIGN KEY ("polling_unit_id") REFERENCES "polling_units"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "electoral_scope_polling_units" DROP CONSTRAINT "FK_43e8df6a282c333d22e48ab70a8"`);
        await queryRunner.query(`ALTER TABLE "electoral_scope_polling_units" DROP CONSTRAINT "FK_cec1b75eac4772e6244e5007cec"`);
        await queryRunner.query(`ALTER TABLE "electoral_scopes" DROP CONSTRAINT "FK_fc00c2492a2a3ea6cb4e6692458"`);
        await queryRunner.query(`ALTER TABLE "electoral_scopes" DROP CONSTRAINT "FK_406faa4afd26356e9a1200324ee"`);
        await queryRunner.query(`ALTER TABLE "electoral_scopes" DROP CONSTRAINT "FK_8a5e75234827beaf5f3bf6ff2fa"`);
        await queryRunner.query(`ALTER TABLE "party_sections" DROP CONSTRAINT "FK_6b8d9a07232bf77094cd07b4d95"`);
        await queryRunner.query(`ALTER TABLE "party_sections" DROP CONSTRAINT "FK_567e9348eba9e551e95871aca32"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_electoral_scope_polling_units_scope_polling_unit"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_electoral_scope_polling_units_scope"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_electoral_scope_polling_units_polling_unit"`);
        await queryRunner.query(`DROP TABLE "electoral_scope_polling_units"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_electoral_scopes_type"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_electoral_scopes_state"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_electoral_scopes_lga"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_electoral_scopes_ward"`);
        await queryRunner.query(`DROP TABLE "electoral_scopes"`);
        await queryRunner.query(`DROP TYPE "public"."electoral_scopes_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."electoral_scopes_scope_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_election_positions_code"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_election_positions_name"`);
        await queryRunner.query(`DROP TABLE "election_positions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_elections_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_elections_election_date"`);
        await queryRunner.query(`DROP TABLE "elections"`);
        await queryRunner.query(`DROP TYPE "public"."elections_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_party_sections_party_name"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_party_sections_party"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_party_sections_parent"`);
        await queryRunner.query(`DROP TABLE "party_sections"`);
        await queryRunner.query(`DROP TYPE "public"."party_sections_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."party_sections_level_enum"`);
    }

}

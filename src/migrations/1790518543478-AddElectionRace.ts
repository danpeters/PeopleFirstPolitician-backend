import { MigrationInterface, QueryRunner } from "typeorm";

export class AddElectionRace1790518543478 implements MigrationInterface {
    name = 'AddElectionRace1790518543478'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."election_races_status_enum" AS ENUM('draft', 'active', 'completed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "election_races" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "election_id" uuid NOT NULL, "election_position_id" uuid NOT NULL, "electoral_scope_id" uuid NOT NULL, "name" character varying(180) NOT NULL, "code" character varying(80) NOT NULL, "status" "public"."election_races_status_enum" NOT NULL DEFAULT 'draft', "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_124a6b20740ce70281dc88fa9ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_election_races_status" ON "election_races" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_election_races_scope" ON "election_races" ("electoral_scope_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_election_races_position" ON "election_races" ("election_position_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_election_races_election" ON "election_races" ("election_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_election_races_election_position_scope" ON "election_races" ("election_id", "election_position_id", "electoral_scope_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_election_races_code" ON "election_races" ("code") `);
        await queryRunner.query(`ALTER TABLE "election_races" ADD CONSTRAINT "FK_14528db3c4cdca014a93c5a3137" FOREIGN KEY ("election_id") REFERENCES "elections"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "election_races" ADD CONSTRAINT "FK_389849288e87c88e24c8b786cdd" FOREIGN KEY ("election_position_id") REFERENCES "election_positions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "election_races" ADD CONSTRAINT "FK_c9783df0320513e7c5b78d5e757" FOREIGN KEY ("electoral_scope_id") REFERENCES "electoral_scopes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "election_races" DROP CONSTRAINT "FK_c9783df0320513e7c5b78d5e757"`);
        await queryRunner.query(`ALTER TABLE "election_races" DROP CONSTRAINT "FK_389849288e87c88e24c8b786cdd"`);
        await queryRunner.query(`ALTER TABLE "election_races" DROP CONSTRAINT "FK_14528db3c4cdca014a93c5a3137"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_election_races_code"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_election_races_election_position_scope"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_election_races_election"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_election_races_position"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_election_races_scope"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_election_races_status"`);
        await queryRunner.query(`DROP TABLE "election_races"`);
        await queryRunner.query(`DROP TYPE "public"."election_races_status_enum"`);
    }

}

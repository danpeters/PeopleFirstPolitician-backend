import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCandidate1790519209830 implements MigrationInterface {
    name = 'AddCandidate1790519209830'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."candidates_status_enum" AS ENUM('active', 'inactive', 'suspended')`);
        await queryRunner.query(`CREATE TABLE "candidates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "first_name" character varying(100) NOT NULL, "middle_name" character varying(100), "last_name" character varying(100) NOT NULL, "display_name" character varying(220) NOT NULL, "date_of_birth" date, "gender" character varying(30), "phone" character varying(30), "email" character varying(180), "address" text, "biography" text, "photo_url" text, "photo_captured_at" TIMESTAMP, "photo_version" integer NOT NULL DEFAULT '1', "status" "public"."candidates_status_enum" NOT NULL DEFAULT 'active', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_140681296bf033ab1eb95288abb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_candidates_display_name" ON "candidates" ("display_name") `);
        await queryRunner.query(`CREATE INDEX "IDX_candidates_status" ON "candidates" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_candidates_user" ON "candidates" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "candidates" ADD CONSTRAINT "FK_94a5fe85e7f5bd0221fa7d6f19c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "candidates" DROP CONSTRAINT "FK_94a5fe85e7f5bd0221fa7d6f19c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_candidates_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_candidates_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_candidates_display_name"`);
        await queryRunner.query(`DROP TABLE "candidates"`);
        await queryRunner.query(`DROP TYPE "public"."candidates_status_enum"`);
    }

}

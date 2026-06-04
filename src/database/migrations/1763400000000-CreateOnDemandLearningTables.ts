import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOnDemandLearningTables1763400000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasContent = await queryRunner.hasTable('on_demand_content');
    if (!hasContent) {
      await queryRunner.query(`
        CREATE TABLE "on_demand_content" (
          "id" SERIAL NOT NULL,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          "title" character varying(255) NOT NULL,
          "description" text,
          "content_type" character varying(32) NOT NULL,
          "subject" character varying(120) NOT NULL,
          "grade_level" character varying(80) NOT NULL,
          "duration_minutes" integer NOT NULL DEFAULT 0,
          "price_per_minute" numeric(8,2) NOT NULL DEFAULT 0,
          "file_type" character varying(32) NOT NULL DEFAULT 'mp4',
          "thumbnail_url" character varying(500),
          "tutor_name" character varying(120) NOT NULL DEFAULT 'Tutor',
          "tutor_avatar_url" character varying(500),
          "popularity_count" integer NOT NULL DEFAULT 0,
          "is_active" boolean NOT NULL DEFAULT true,
          CONSTRAINT "PK_on_demand_content" PRIMARY KEY ("id")
        );
        CREATE INDEX "IDX_on_demand_content_type" ON "on_demand_content" ("content_type");
      `);
    }

    const hasSaved = await queryRunner.hasTable('on_demand_content_saved');
    if (!hasSaved) {
      await queryRunner.query(`
        CREATE TABLE "on_demand_content_saved" (
          "id" SERIAL NOT NULL,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          "user_id" integer NOT NULL,
          "content_id" integer NOT NULL,
          CONSTRAINT "PK_on_demand_content_saved" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_on_demand_saved_user_content" UNIQUE ("user_id", "content_id"),
          CONSTRAINT "FK_on_demand_saved_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_on_demand_saved_content" FOREIGN KEY ("content_id") REFERENCES "on_demand_content"("id") ON DELETE CASCADE
        );
        CREATE INDEX "IDX_on_demand_saved_user" ON "on_demand_content_saved" ("user_id");
      `);
    }

    const hasCart = await queryRunner.hasTable('on_demand_cart_item');
    if (!hasCart) {
      await queryRunner.query(`
        CREATE TABLE "on_demand_cart_item" (
          "id" SERIAL NOT NULL,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          "user_id" integer NOT NULL,
          "content_id" integer NOT NULL,
          CONSTRAINT "PK_on_demand_cart_item" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_on_demand_cart_user_content" UNIQUE ("user_id", "content_id"),
          CONSTRAINT "FK_on_demand_cart_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_on_demand_cart_content" FOREIGN KEY ("content_id") REFERENCES "on_demand_content"("id") ON DELETE CASCADE
        );
        CREATE INDEX "IDX_on_demand_cart_user" ON "on_demand_cart_item" ("user_id");
      `);
    }

    const countResult = await queryRunner.query(
      `SELECT COUNT(*)::int AS cnt FROM "on_demand_content"`,
    );
    const count = Number(countResult?.[0]?.cnt ?? 0);
    if (count === 0) {
      await queryRunner.query(`
        INSERT INTO "on_demand_content" (
          "title", "description", "content_type", "subject", "grade_level",
          "duration_minutes", "price_per_minute", "file_type", "thumbnail_url",
          "tutor_name", "popularity_count"
        ) VALUES
        ('Fractions Made Simple', 'Visual fraction blocks and step-by-step examples.', 'video', 'Math', 'Middle', 12, 5.00, 'mp4', NULL, 'Alex', 980),
        ('Algebra Equations', 'Solve linear equations with guided practice.', 'video', 'Math', 'High', 15, 5.00, 'mp4', NULL, 'Maya', 920),
        ('Essay Writing', 'Structure and revise strong essays.', 'video', 'English', 'High', 18, 6.00, 'mp4', NULL, 'Alex', 870),
        ('Intro to Photosynthesis', 'Reading guide with diagrams and glossary.', 'pdf', 'Science', 'Middle', 20, 4.00, 'pdf', NULL, 'Jordan', 410),
        ('US History Timeline', 'Reference charts for key events.', 'pdf', 'History', 'High', 25, 4.50, 'pdf', NULL, 'Sam', 380),
        ('Grammar Quick Reference', 'Punctuation and sentence rules.', 'pdf', 'English', 'Middle', 15, 3.50, 'pdf', NULL, 'Alex', 350),
        ('Multiplication Drills', 'Structured practice sets with answer keys.', 'worksheet', 'Math', 'Middle', 30, 3.00, 'pdf', NULL, 'Maya', 520),
        ('Fraction Word Problems', 'Apply fractions in real-world scenarios.', 'worksheet', 'Math', 'Middle', 25, 3.50, 'pdf', NULL, 'Alex', 490),
        ('Reading Comprehension Pack', 'Passages with guided questions.', 'worksheet', 'English', 'High', 35, 4.00, 'docx', NULL, 'Jordan', 440),
        ('Algebra Basics Quiz', 'Quick drills on variables and expressions.', 'quiz', 'Math', 'High', 10, 2.50, 'quiz', NULL, 'Maya', 610),
        ('Geometry Angles Quiz', 'Identify and compute angle measures.', 'quiz', 'Math', 'High', 12, 2.50, 'quiz', NULL, 'Sam', 580),
        ('Vocabulary Builder Quiz', 'Synonyms, antonyms, and context clues.', 'quiz', 'English', 'Middle', 8, 2.00, 'quiz', NULL, 'Alex', 550);
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "on_demand_cart_item" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "on_demand_content_saved" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "on_demand_content" CASCADE`);
  }
}

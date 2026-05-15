import { MigrationInterface, QueryRunner } from 'typeorm';

export class BaselineCoreTables1650000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('user')) {
      return;
    }

    const safeEnum = async (sql: string) => {
      await queryRunner.query(`DO $$ BEGIN ${sql} EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    };
    await safeEnum(`CREATE TYPE "user_role" AS ENUM ('student', 'tutor', 'admin', 'support');`);
    await safeEnum(`CREATE TYPE "user_status" AS ENUM ('active', 'inactive', 'suspended', 'pending');`);
    await safeEnum(`CREATE TYPE "prospects_status_enum" AS ENUM ('pending', 'active', 'suspended');`);
    await safeEnum(
      `CREATE TYPE "booking_status_enum" AS ENUM ('pending', 'tutor_review', 'confirmed', 'cancelled', 'completed', 'no_show', 'disputed');`,
    );
    await safeEnum(`CREATE TYPE "review_status_enum" AS ENUM ('pending', 'approved', 'rejected', 'flagged');`);
    await safeEnum(`CREATE TYPE "promo_code_discount_type_enum" AS ENUM ('percentage', 'fixed_amount');`);
    await safeEnum(`CREATE TYPE "interviews_status_enum" AS ENUM ('scheduled', 'completed', 'cancelled');`);

    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "email" character varying(255) NOT NULL,
        "phone_number" character varying(20),
        "password_hash" character varying(255) NOT NULL,
        "first_name" character varying(100) NOT NULL,
        "last_name" character varying(100) NOT NULL,
        "role" "user_role" NOT NULL DEFAULT 'student',
        "status" "user_status" NOT NULL DEFAULT 'pending',
        "profile_photo_url" character varying(500),
        "two_factor_enabled" boolean NOT NULL DEFAULT false,
        "two_factor_secret" character varying(255),
        "stripe_connected_account_id" character varying(255),
        "stripe_onboarding_complete" boolean NOT NULL DEFAULT false,
        "google_calendar_refresh_token" text,
        "google_calendar_access_token" text,
        "google_calendar_token_expiry" TIMESTAMP,
        "last_login_at" TIMESTAMP,
        "last_login_ip" character varying(100),
        "email_verified" boolean NOT NULL DEFAULT false,
        "email_verification_token" character varying(255),
        "email_verified_at" TIMESTAMP,
        "phone_verified" boolean NOT NULL DEFAULT false,
        "phone_verified_at" TIMESTAMP,
        "password_reset_token" character varying(255),
        "password_reset_expiry" TIMESTAMP,
        "refresh_token" text,
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_user" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_email" UNIQUE ("email")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "subject" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying(255) NOT NULL,
        "description" text,
        "category" character varying(100),
        CONSTRAINT "PK_subject" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_subject_name" UNIQUE ("name")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "prospects" (
        "id" SERIAL NOT NULL,
        "prospect_id" character varying(5),
        "user_id" integer,
        "subjects" text NOT NULL DEFAULT '',
        "gradeLevels" text NOT NULL DEFAULT '',
        "yearsOfExperience" integer NOT NULL DEFAULT 0,
        "teachingPhilosophy" text NOT NULL DEFAULT '',
        "cv" character varying,
        "introVideo" character varying,
        "interviewTime" TIMESTAMP,
        "fullName" character varying NOT NULL DEFAULT 'Placeholder',
        "dateOfBirth" date NOT NULL DEFAULT '2000-01-01',
        "govId" character varying,
        "profilePic" character varying,
        "status" "prospects_status_enum" NOT NULL DEFAULT 'pending',
        "setup_complete" boolean NOT NULL DEFAULT false,
        "payment_account_id" character varying(255),
        "customer_id" character varying(255),
        "payment_onboarded" boolean NOT NULL DEFAULT false,
        "fee" decimal(10,2),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_prospects" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_prospects_prospect_id" UNIQUE ("prospect_id"),
        CONSTRAINT "FK_prospects_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "booking" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "reference_number" character varying(20),
        "student_profile_id" integer NOT NULL,
        "tutor_profile_id" integer NOT NULL,
        "subject_id" integer,
        "start_time" TIMESTAMP NOT NULL,
        "end_time" TIMESTAMP NOT NULL,
        "status" "booking_status_enum" NOT NULL DEFAULT 'tutor_review',
        "total_price" decimal(10,2) NOT NULL,
        "platform_fee" decimal(10,2),
        "stripe_payment_intent_id" character varying(255),
        "zoom_meeting_id" character varying(255),
        "zoom_join_link" character varying(500),
        "host_start_url" character varying(500),
        "cancelled_at" TIMESTAMP,
        "cancelled_by" integer,
        "cancellation_reason" text,
        "refund_eligible" boolean NOT NULL DEFAULT true,
        "completed_at" TIMESTAMP,
        "review_added" boolean NOT NULL DEFAULT false,
        "has_refunded" boolean NOT NULL DEFAULT false,
        "discount_code" character varying(50),
        "discount_amount" decimal(10,2),
        "final_price" decimal(10,2),
        CONSTRAINT "PK_booking" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_booking_reference_number" UNIQUE ("reference_number"),
        CONSTRAINT "FK_booking_student" FOREIGN KEY ("student_profile_id") REFERENCES "user"("id"),
        CONSTRAINT "FK_booking_tutor" FOREIGN KEY ("tutor_profile_id") REFERENCES "prospects"("id"),
        CONSTRAINT "FK_booking_subject" FOREIGN KEY ("subject_id") REFERENCES "subject"("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "message" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "sender_id" integer NOT NULL,
        "receiver_id" integer NOT NULL,
        "content" text NOT NULL,
        "booking_id" integer,
        CONSTRAINT "PK_message" PRIMARY KEY ("id"),
        CONSTRAINT "FK_message_sender" FOREIGN KEY ("sender_id") REFERENCES "user"("id"),
        CONSTRAINT "FK_message_receiver" FOREIGN KEY ("receiver_id") REFERENCES "user"("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "review" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "booking_id" integer NOT NULL,
        "student_profile_id" integer NOT NULL,
        "tutor_profile_id" integer NOT NULL,
        "rating" integer NOT NULL,
        "comment" text,
        "is_flagged" boolean NOT NULL DEFAULT false,
        "flag_reason" text,
        "status" "review_status_enum" NOT NULL DEFAULT 'pending',
        CONSTRAINT "PK_review" PRIMARY KEY ("id"),
        CONSTRAINT "FK_review_booking" FOREIGN KEY ("booking_id") REFERENCES "booking"("id"),
        CONSTRAINT "FK_review_student" FOREIGN KEY ("student_profile_id") REFERENCES "user"("id"),
        CONSTRAINT "FK_review_tutor" FOREIGN KEY ("tutor_profile_id") REFERENCES "prospects"("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "notification" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "user_id" integer NOT NULL,
        "type" character varying(50),
        "title" character varying(255),
        "message" text,
        "is_read" boolean NOT NULL DEFAULT false,
        "read_at" TIMESTAMP,
        "is_sent" boolean NOT NULL DEFAULT false,
        "channel" character varying(50),
        "action_url" text,
        CONSTRAINT "PK_notification" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notification_user" FOREIGN KEY ("user_id") REFERENCES "user"("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "interviews" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "user_id" integer NOT NULL,
        "start_time" TIMESTAMP NOT NULL,
        "zoom_meeting_id" character varying(255) NOT NULL,
        "host_start_url" text NOT NULL,
        "participant_join_url" text NOT NULL,
        "meeting_password" character varying(100) NOT NULL,
        "status" "interviews_status_enum" NOT NULL DEFAULT 'scheduled',
        CONSTRAINT "PK_interviews" PRIMARY KEY ("id"),
        CONSTRAINT "FK_interviews_user" FOREIGN KEY ("user_id") REFERENCES "user"("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "testimonials" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "testimonial" text NOT NULL,
        "testimonial_by" character varying(255) NOT NULL,
        CONSTRAINT "PK_testimonials" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "promo_code" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "code" character varying(50) NOT NULL,
        "discount_type" "promo_code_discount_type_enum" NOT NULL,
        "discount_value" decimal(10,2) NOT NULL,
        "valid_from" TIMESTAMP,
        "valid_until" TIMESTAMP,
        "usage_limit" integer,
        "usage_count" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "min_booking_amount" decimal(10,2),
        "applicable_to" character varying(50),
        "stripe_coupon_id" character varying(255),
        CONSTRAINT "PK_promo_code" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_promo_code_code" UNIQUE ("code")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "promo_code" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "testimonials" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "interviews" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "review" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "message" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "booking" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "prospects" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subject" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "promo_code_discount_type_enum" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "review_status_enum" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "booking_status_enum" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "prospects_status_enum" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "interviews_status_enum" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_status" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role" CASCADE`);
  }
}

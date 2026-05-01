import { MigrationInterface, QueryRunner } from 'typeorm';

const TOPICS: { slug: string; title: string; sort: number; questions: { key: string; body: string; sort: number }[] }[] =
  [
    {
      slug: 'teachingPhilosophy',
      title: 'Teaching Philosophy',
      sort: 0,
      questions: [
        {
          key: 'A',
          sort: 0,
          body:
            'A student completes problems correctly when guided but hesitates and second-guesses their answers when working independently. How would you handle this situation?',
        },
        {
          key: 'B',
          sort: 1,
          body:
            "Midway through a session, you notice the student becoming quieter and less engaged, even though the material and difficulty level haven't changed. How would you respond?",
        },
        {
          key: 'C',
          sort: 2,
          body:
            "A student looks at a new assignment, pauses and says, 'I don't know where to start,' even after reviewing the instructions. What would you do next?",
        },
      ],
    },
    {
      slug: 'handlingChallenges',
      title: 'Handling Challenges',
      sort: 1,
      questions: [
        {
          key: 'A',
          sort: 0,
          body:
            'A student continues using the same approach to solve a problem, even after it leads to incorrect results. How would you handle this?',
        },
        {
          key: 'B',
          sort: 1,
          body:
            'During a session, you notice participation slowing down and responses becoming shorter. How would you address this situation?',
        },
        {
          key: 'C',
          sort: 2,
          body: 'A student pauses midway through a problem and says they are unsure what to do next. What would you do from there?',
        },
      ],
    },
    {
      slug: 'studentEngagement',
      title: 'Student Engagement',
      sort: 2,
      questions: [
        {
          key: 'A',
          sort: 0,
          body:
            'A student shows strong interest in a topic and begins asking additional questions beyond the lesson plan. How would you respond?',
        },
        {
          key: 'B',
          sort: 1,
          body:
            'During a group session, multiple students begin speaking at the same time and the discussion loses focus. What would you do next?',
        },
        {
          key: 'C',
          sort: 2,
          body:
            "A student resists using a method you've introduced and prefers to work through the problem their own way. How would you handle it?",
        },
      ],
    },
    {
      slug: 'problemSolving',
      title: 'Problem Solving',
      sort: 3,
      questions: [
        {
          key: 'A',
          sort: 0,
          body: 'A student asks a question that does not have a clear or immediate answer. How would you approach this situation?',
        },
        {
          key: 'B',
          sort: 1,
          body: 'A student begins working on a task but loses direction and the session starts to drift. What would you do next?',
        },
        {
          key: 'C',
          sort: 2,
          body: 'A student becomes confused partway through a difficult topic. How would you proceed from that point?',
        },
      ],
    },
    {
      slug: 'selfReflectionGrowth',
      title: 'Self-Reflection / Growth',
      sort: 4,
      questions: [
        {
          key: 'A',
          sort: 0,
          body:
            'Think about a recent tutoring session that did not go as well as expected. What would you change if you could go back and do that particular session over?',
        },
        {
          key: 'B',
          sort: 1,
          body:
            'Think about a recent tutoring session where student engagement was lower than usual. How would you adjust your approach next time?',
        },
        {
          key: 'C',
          sort: 2,
          body:
            'Think about a recent tutoring session where a student struggled to make progress. What would you modify going forward?',
        },
      ],
    },
  ];

export class InterviewQuestionnaire1763000000000 implements MigrationInterface {
  name = 'InterviewQuestionnaire1763000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "interview_topic" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "slug" character varying(64) NOT NULL,
        "title" character varying(255) NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_interview_topic" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_interview_topic_slug" UNIQUE ("slug")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "interview_question" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "topic_id" integer NOT NULL,
        "option_key" character varying(8) NOT NULL,
        "body" text NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_interview_question" PRIMARY KEY ("id"),
        CONSTRAINT "FK_interview_question_topic" FOREIGN KEY ("topic_id") REFERENCES "interview_topic"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_interview_question_topic_option" UNIQUE ("topic_id", "option_key")
      )
    `);

    for (const t of TOPICS) {
      await queryRunner.query(
        `INSERT INTO "interview_topic" ("slug", "title", "sort_order", "is_active") VALUES ($1, $2, $3, true)`,
        [t.slug, t.title, t.sort],
      );
      const rows = await queryRunner.query(`SELECT id FROM "interview_topic" WHERE slug = $1`, [t.slug]);
      const topicId = rows[0]?.id;
      if (!topicId) continue;
      for (const q of t.questions) {
        await queryRunner.query(
          `INSERT INTO "interview_question" ("topic_id", "option_key", "body", "sort_order", "is_active") VALUES ($1, $2, $3, $4, true)`,
          [topicId, q.key, q.body, q.sort],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "interview_question"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "interview_topic"`);
  }
}

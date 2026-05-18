import { config } from 'dotenv';
import { DataSource, IsNull } from 'typeorm';
import { Prospect } from '../entities/prospect.entity';
import { User } from '../entities/user.entity';
import { ProspectStatus } from '../entities/enums';

config();

const parseBoolean = (value: string | undefined, defaultValue = false): boolean => {
  if (!value) return defaultValue;
  return ['true', '1', 'yes', 'y'].includes(value.trim().toLowerCase());
};

async function main() {
  const sslEnabled = parseBoolean(process.env.DATABASE_SSL, false);
  const sslRejectUnauthorized = parseBoolean(
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED,
    false,
  );
  const sslOptions = sslEnabled ? { rejectUnauthorized: sslRejectUnauthorized } : undefined;

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'password',
    database: process.env.DATABASE_NAME || 'tutor_scene_db',
    entities: [User, Prospect],
    synchronize: false,
    logging: false,
    ...(sslOptions ? { ssl: sslOptions } : {}),
  });

  await dataSource.initialize();
  const repo = dataSource.getRepository(Prospect);

  await dataSource.query(`
    ALTER TABLE "prospects"
    ADD COLUMN IF NOT EXISTS "parent_prospect_id" integer
  `);

  const all = await repo.find({ order: { updatedAt: 'DESC' } });
  const byUser = new Map<number, Prospect[]>();
  for (const row of all) {
    if (row.userId == null) continue;
    const list = byUser.get(row.userId) ?? [];
    list.push(row);
    byUser.set(row.userId, list);
  }

  let healedActive = 0;
  let linkedDrafts = 0;
  let removedDuplicates = 0;

  for (const [userId, rows] of byUser.entries()) {
    const roots = rows.filter((r) => !r.parentProspectId);
    const liveRoots = roots.filter(
      (r) =>
        r.status === ProspectStatus.ACTIVE ||
        (r.paymentAccountId && r.status === ProspectStatus.PENDING),
    );

    let published =
      liveRoots.find((r) => r.paymentAccountId) ??
      liveRoots.find((r) => r.status === ProspectStatus.ACTIVE) ??
      liveRoots[0] ??
      null;

    if (published) {
      if (
        published.paymentAccountId &&
        published.status !== ProspectStatus.ACTIVE
      ) {
        published.status = ProspectStatus.ACTIVE;
        await repo.save(published);
        healedActive += 1;
      }
    }

    const orphanPending = roots.filter(
      (r) =>
        r.status === ProspectStatus.PENDING &&
        (!published || r.id !== published.id),
    );

    if (published && published.status === ProspectStatus.ACTIVE) {
      const existingDrafts = rows.filter(
        (r) => r.parentProspectId === published!.id,
      );
      let draft =
        existingDrafts.find((r) => r.status === ProspectStatus.PENDING) ??
        null;

      if (!draft && orphanPending.length > 0) {
        const [primary, ...extras] = orphanPending.sort(
          (a, b) =>
            (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0),
        );
        primary.parentProspectId = published.id;
        await repo.save(primary);
        draft = primary;
        linkedDrafts += 1;
        for (const extra of extras) {
          await repo.remove(extra);
          removedDuplicates += 1;
        }
      } else {
        for (const orphan of orphanPending) {
          if (draft && orphan.id !== draft.id) {
            await repo.remove(orphan);
            removedDuplicates += 1;
          }
        }
      }

      const extraDrafts = rows.filter(
        (r) =>
          r.parentProspectId === published!.id &&
          r.status === ProspectStatus.PENDING &&
          draft &&
          r.id !== draft.id,
      );
      for (const extra of extraDrafts) {
        await repo.remove(extra);
        removedDuplicates += 1;
      }
    } else if (!published && orphanPending.length > 1) {
      const [, ...extras] = orphanPending.sort(
        (a, b) =>
          (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0),
      );
      for (const extra of extras) {
        await repo.remove(extra);
        removedDuplicates += 1;
      }
    }

    const duplicateActive = liveRoots.filter(
      (r) => published && r.id !== published.id,
    );
    for (const dup of duplicateActive) {
      if (published && dup.paymentAccountId && !published.paymentAccountId) {
        published.paymentAccountId = dup.paymentAccountId;
        published.customerId = dup.customerId;
        published.paymentOnBoarded = dup.paymentOnBoarded;
        published.setupComplete = dup.setupComplete;
        await repo.save(published);
      }
      await repo.remove(dup);
      removedDuplicates += 1;
    }
  }

  console.log('Prospect profile repair complete.');
  console.log(`  Users processed: ${byUser.size}`);
  console.log(`  Restored active status: ${healedActive}`);
  console.log(`  Linked orphan pending as drafts: ${linkedDrafts}`);
  console.log(`  Removed duplicate rows: ${removedDuplicates}`);

  const visibleCount = await repo.count({
    where: {
      parentProspectId: IsNull(),
      status: ProspectStatus.ACTIVE,
    },
  });
  console.log(`  Published active tutors visible to students: ${visibleCount}`);

  await dataSource.destroy();
}

main().catch((err) => {
  console.error('Repair failed:', err);
  process.exit(1);
});

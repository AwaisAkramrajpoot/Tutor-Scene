-- One-time repair for tutor prospect rows (published vs draft).
-- Run against your tutor_scene database, e.g.:
--   psql -h localhost -U postgres -d tutor_scene_db -f scripts/repair-prospect-profiles.sql

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS parent_prospect_id integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FK_prospects_parent'
  ) THEN
    ALTER TABLE prospects
      ADD CONSTRAINT "FK_prospects_parent"
      FOREIGN KEY (parent_prospect_id) REFERENCES prospects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Restore approved tutors that were wrongly set back to pending
UPDATE prospects
SET status = 'active'
WHERE parent_prospect_id IS NULL
  AND payment_account_id IS NOT NULL
  AND status = 'pending';

-- Link orphan pending roots under their published active parent (keep newest pending as draft)
WITH ranked AS (
  SELECT
    p.id,
    p.user_id,
    pub.id AS published_id,
    ROW_NUMBER() OVER (
      PARTITION BY p.user_id
      ORDER BY p.updated_at DESC NULLS LAST, p.id DESC
    ) AS rn
  FROM prospects p
  INNER JOIN prospects pub
    ON pub.user_id = p.user_id
    AND pub.parent_prospect_id IS NULL
    AND pub.status = 'active'
  WHERE p.parent_prospect_id IS NULL
    AND p.status = 'pending'
    AND p.id <> pub.id
),
primary_draft AS (
  SELECT id, published_id FROM ranked WHERE rn = 1
)
UPDATE prospects p
SET parent_prospect_id = d.published_id
FROM primary_draft d
WHERE p.id = d.id;

-- Remove extra orphan pending duplicates (same user, not linked as draft)
DELETE FROM prospects p
USING prospects pub
WHERE p.user_id = pub.user_id
  AND pub.parent_prospect_id IS NULL
  AND pub.status = 'active'
  AND p.parent_prospect_id IS NULL
  AND p.status = 'pending'
  AND p.id <> pub.id
  AND EXISTS (
    SELECT 1 FROM prospects d
    WHERE d.parent_prospect_id = pub.id
      AND d.user_id = p.user_id
      AND d.status = 'pending'
  );

-- Remove duplicate pending roots when no published active exists (keep newest)
DELETE FROM prospects p
USING (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id
        ORDER BY updated_at DESC NULLS LAST, id DESC
      ) AS rn
    FROM prospects
    WHERE user_id IS NOT NULL
      AND parent_prospect_id IS NULL
      AND status = 'pending'
      AND user_id NOT IN (
        SELECT user_id FROM prospects
        WHERE parent_prospect_id IS NULL AND status = 'active' AND user_id IS NOT NULL
      )
  ) x
  WHERE rn > 1
) dup
WHERE p.id = dup.id;

SELECT
  status,
  COUNT(*) FILTER (WHERE parent_prospect_id IS NULL) AS published_roots,
  COUNT(*) FILTER (WHERE parent_prospect_id IS NOT NULL) AS drafts
FROM prospects
GROUP BY status
ORDER BY status;

-- Clean up client records WP-2026-0001 through WP-2026-0010
-- and all associated application/data records.

BEGIN;

-- Step 1: Delete non-cascading children of applications belonging to target clients
DELETE FROM documents
WHERE "applicationId" IN (
  SELECT a.id FROM applications a
  JOIN clients c ON c.id = a."clientId"
  WHERE c."fileNumber" IN ('WP-2026-0001','WP-2026-0002','WP-2026-0003','WP-2026-0004','WP-2026-0005','WP-2026-0006','WP-2026-0007','WP-2026-0008','WP-2026-0009','WP-2026-0010')
);

DELETE FROM tasks
WHERE "applicationId" IN (
  SELECT a.id FROM applications a
  JOIN clients c ON c.id = a."clientId"
  WHERE c."fileNumber" IN ('WP-2026-0001','WP-2026-0002','WP-2026-0003','WP-2026-0004','WP-2026-0005','WP-2026-0006','WP-2026-0007','WP-2026-0008','WP-2026-0009','WP-2026-0010')
);

DELETE FROM payments
WHERE "applicationId" IN (
  SELECT a.id FROM applications a
  JOIN clients c ON c.id = a."clientId"
  WHERE c."fileNumber" IN ('WP-2026-0001','WP-2026-0002','WP-2026-0003','WP-2026-0004','WP-2026-0005','WP-2026-0006','WP-2026-0007','WP-2026-0008','WP-2026-0009','WP-2026-0010')
);

-- Step 2: Delete applications (cascades to: application_stage_history, submission_records,
--         quality_reviews, tracking_updates, application_document_requirements)
DELETE FROM applications
WHERE "clientId" IN (
  SELECT id FROM clients
  WHERE "fileNumber" IN ('WP-2026-0001','WP-2026-0002','WP-2026-0003','WP-2026-0004','WP-2026-0005','WP-2026-0006','WP-2026-0007','WP-2026-0008','WP-2026-0009','WP-2026-0010')
);

-- Step 3: Delete non-cascading children of target clients
DELETE FROM documents
WHERE "clientId" IN (
  SELECT id FROM clients
  WHERE "fileNumber" IN ('WP-2026-0001','WP-2026-0002','WP-2026-0003','WP-2026-0004','WP-2026-0005','WP-2026-0006','WP-2026-0007','WP-2026-0008','WP-2026-0009','WP-2026-0010')
);

DELETE FROM tasks
WHERE "clientId" IN (
  SELECT id FROM clients
  WHERE "fileNumber" IN ('WP-2026-0001','WP-2026-0002','WP-2026-0003','WP-2026-0004','WP-2026-0005','WP-2026-0006','WP-2026-0007','WP-2026-0008','WP-2026-0009','WP-2026-0010')
);

DELETE FROM payments
WHERE "clientId" IN (
  SELECT id FROM clients
  WHERE "fileNumber" IN ('WP-2026-0001','WP-2026-0002','WP-2026-0003','WP-2026-0004','WP-2026-0005','WP-2026-0006','WP-2026-0007','WP-2026-0008','WP-2026-0009','WP-2026-0010')
);

-- Step 4: Delete clients (cascades to: activity_logs)
DELETE FROM clients
WHERE "fileNumber" IN ('WP-2026-0001','WP-2026-0002','WP-2026-0003','WP-2026-0004','WP-2026-0005','WP-2026-0006','WP-2026-0007','WP-2026-0008','WP-2026-0009','WP-2026-0010');

COMMIT;

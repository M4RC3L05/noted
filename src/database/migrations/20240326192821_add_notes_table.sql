-- migrate:up
CREATE TABLE notes (
  id text PRIMARY KEY NOT NULL DEFAULT (uuid_v4()),
  name text NOT NULL,
  content text,
  created_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at text
) strict,
without rowid;

CREATE trigger "notes_update_updated_at"
AFTER
UPDATE
  ON notes FOR each ROW
  WHEN new.updated_at = old.updated_at
BEGIN
UPDATE
  notes
SET
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE
  id = old.id;

END
--
-- migrate:down

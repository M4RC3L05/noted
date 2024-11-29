import type { NotesTable } from "#src/database/types/mod.ts";
import type { CustomDatabase } from "#src/database/mod.ts";

export const loadNote = (db: CustomDatabase, data?: Partial<NotesTable>) => {
  return db.sql<NotesTable>`
    insert into notes (id, name, content, deleted_at, created_at, updated_at)
    values (
      ${data?.id ?? crypto.randomUUID()},
      ${data?.name ?? "foo"},
      ${data?.content ?? null},
      ${data?.deletedAt ?? null},
      ${data?.createdAt ?? new Date().toISOString()},
      ${data?.updatedAt ?? new Date().toISOString()}
    )
    returning id, name, content, deleted_at as "deletedAt", created_at as "createdAt", updated_at as "updatedAt"
  `.at(0)!;
};

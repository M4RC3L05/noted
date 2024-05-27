import type { Hono } from "@hono/hono";
import vine from "@vinejs/vine";
import { sql } from "@m4rc3l05/sqlite-tag";

const getNotesQuerySchema = vine.object({ trashed: vine.string().optional() });
const getNotesQueryValidator = vine.compile(getNotesQuerySchema);

export const all = (app: Hono) => {
  app.get("/", async (c) => {
    const { trashed } = await getNotesQueryValidator.validate(
      c.req.query(),
    );
    const showTrashed = typeof trashed === "string";

    const notes = c.get("db").all(
      sql`
        select
          id, name, created_at, updated_at
          ${sql.if(showTrashed, () => sql`, deleted_at`)}
        from notes
          ${
        sql.ternary(showTrashed, () =>
          sql`where deleted_at is not null`, () =>
          sql`where deleted_at is null`)
      }
        order by updated_at desc`,
    );

    return c.json({ data: notes });
  });
};

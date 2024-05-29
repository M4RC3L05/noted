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

    const where = sql.ternary(
      typeof trashed === "string",
      sql`where deleted_at is not null`,
      sql`where deleted_at is null`,
    );

    const notes = c.get("db").all(
      sql`
        select
          id, name, created_at, updated_at
        from notes
          ${where}
        order by updated_at desc
      `,
    );

    return c.json({ data: notes });
  });
};

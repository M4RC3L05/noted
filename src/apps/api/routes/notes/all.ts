import type { Hono } from "hono";
import vine from "@vinejs/vine";
import { sql } from "@m4rc3l05/sqlite-tag";

const getNotesQuerySchema = vine.object({
  includeDeleted: vine.string().optional(),
});
const getNotesQueryValidator = vine.compile(getNotesQuerySchema);

export const all = (app: Hono) => {
  app.get("/", async (c) => {
    const { includeDeleted } = await getNotesQueryValidator.validate(
      c.req.query(),
    );
    const showDeleted = typeof includeDeleted === "string";

    const notes = c.get("db").all(
      sql`
        select
          id, name, created_at, updated_at
          ${sql.if(showDeleted, () => sql`, deleted_at`)}
        from notes
          ${sql.if(showDeleted, () => sql`where deleted_at is null`)}
        order by updated_at desc`,
    );

    return c.json({ data: notes });
  });
};

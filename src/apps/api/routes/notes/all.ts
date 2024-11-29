import type { Hono } from "@hono/hono";
import vine from "@vinejs/vine";

const getNotesQuerySchema = vine.object({ trashed: vine.string().optional() });
const getNotesQueryValidator = vine.compile(getNotesQuerySchema);

export const all = (app: Hono) => {
  app.get("/", async (c) => {
    const { trashed } = await getNotesQueryValidator.validate(
      c.req.query(),
    );
    const showTrashed = typeof trashed === "string";

    const notes = c.get("db").sql`
      select
        id, name, deleted_at as "deletedAt", created_at as "createdAt", updated_at as "updatedAt"
      from notes
      where
        case
          when ${showTrashed} = true then deleted_at is not null
          when ${showTrashed} = false then deleted_at is null
        end
      order by updated_at desc
    `;

    return c.json({ data: notes });
  });
};

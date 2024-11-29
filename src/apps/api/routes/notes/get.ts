import type { Hono } from "@hono/hono";
import { HTTPException } from "@hono/hono/http-exception";
import vine from "@vinejs/vine";

const getNoteParamsSchema = vine.object({ id: vine.string() });
const getNoteParamsValidator = vine.compile(getNoteParamsSchema);

export const get = (app: Hono) => {
  app.get("/:id", async (c) => {
    const { id } = await getNoteParamsValidator.validate(c.req.param());

    const [note] = c.get("db")
      .sql`
        select 
          id, name, content, deleted_at as "deletedAt", created_at as "createdAt", updated_at as "updatedAt"
        from notes
        where id = ${id}
        limit 1`;

    if (!note) {
      throw new HTTPException(404, { message: "Could not find note" });
    }

    return c.json({ data: note });
  });
};

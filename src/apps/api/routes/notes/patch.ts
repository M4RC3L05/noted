import type { Hono } from "hono";
import vine from "@vinejs/vine";
import { sql } from "@m4rc3l05/sqlite-tag";

const editNoteParamsSchema = vine.object({ id: vine.string() });
const editNoteParamsValidator = vine.compile(editNoteParamsSchema);

const editNoteBodySchema = vine.object({
  name: vine.string().minLength(1).trim().optional().requiredIfMissing([
    "content",
    "delete",
  ]),
  content: vine.string().optional().requiredIfMissing(["name", "delete"]),
  delete: vine.boolean().optional().requiredIfMissing(["name", "content"]),
});
const editNoteBodyValidator = vine.compile(editNoteBodySchema);

export const patch = (app: Hono) => {
  app.patch(
    "/:id",
    async (c) => {
      const { id } = await editNoteParamsValidator.validate(c.req.param());
      const { content, name, delete: del } = await editNoteBodyValidator
        .validate(await c.req.json());
      const updateData = {
        name,
        content,
        deleted_at: typeof del === "boolean"
          ? del ? new Date().toISOString() : null
          : undefined,
      };

      const note = c.get("db").get(sql`
        update notes
        set ${sql.set(updateData)}
        where id = ${id}
        returning *;
      `);

      return c.json({ data: note });
    },
  );
};

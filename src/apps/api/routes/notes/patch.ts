import type { Hono } from "@hono/hono";
import vine from "@vinejs/vine";
import { HTTPException } from "@hono/hono/http-exception";

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
        deletedAt: typeof del === "boolean"
          ? del ? new Date().toISOString() : null
          : undefined,
      };

      const [note] = c.get("db").sql`
        update notes
        set 
          name = coalesce(${updateData.name ?? null}, name),
          content = coalesce(${updateData.content ?? null}, content),
          deleted_at = coalesce(${updateData.deletedAt ?? null}, deleted_at)
        where id = ${id}
        returning id, name, content, deleted_at as "deletedAt", created_at as "createdAt", updated_at as "updatedAt";
      `;

      if (!note) {
        throw new HTTPException(404, { message: "Could not find note" });
      }

      return c.json({ data: note });
    },
  );
};

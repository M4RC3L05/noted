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
  content: vine.string().nullable().optional().requiredIfMissing([
    "name",
    "delete",
  ]),
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
        name: name === undefined ? -1 : name,
        content: content === undefined ? -1 : content,
        deletedAt: typeof del === "boolean"
          ? (del ? new Date().toISOString() : null)
          : -1,
      };

      const [updatedNote] = c.get("db").sql<{ id: string }>`
        update notes
        set 
          name = iif(${updateData.name} = -1, name, ${updateData.name}),
          content = iif(${updateData.content} = -1, content, ${updateData.content}),
          deleted_at = iif(${updateData.deletedAt} = -1, deleted_at, ${updateData.deletedAt})
        where id = ${id}
        returning id;
      `;

      if (!updatedNote) {
        throw new HTTPException(404, { message: "Could not find note" });
      }

      const [note] = c.get("db").sql`
        select id, name, content, deleted_at as "deletedAt", created_at as "createdAt", updated_at as "updatedAt"
        from notes
        where id = ${id}
      `;

      return c.json({ data: note });
    },
  );
};

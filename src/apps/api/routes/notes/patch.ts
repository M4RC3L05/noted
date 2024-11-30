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
          name = (
            case
              when ${updateData.name} = -1 THEN name
              else ${updateData.name}
            end
          ),
          content = (
            case
              when ${updateData.content} = -1 THEN content
              else ${updateData.content}
            end
          ),
          deleted_at = (
            case
              when ${updateData.deletedAt} = -1 THEN deleted_at
              else ${updateData.deletedAt}
            end
          )
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

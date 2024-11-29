import type { Hono } from "@hono/hono";
import vine from "@vinejs/vine";

const createNoteBodySchema = vine.object({
  name: vine.string().minLength(1).trim(),
  content: vine.string().optional(),
});
const createNoteBodyValidator = vine.compile(createNoteBodySchema);

export const create = (app: Hono) => {
  app.post("/", async (c) => {
    const { content, name } = await createNoteBodyValidator.validate(
      await c.req.json(),
    );

    const note = c.get("db").sql`
      insert into notes (content, name)
      values (${content ?? null}, ${name})
      returning id, name, deleted_at as "deletedAt", created_at as "createdAt", updated_at as "updatedAt";
    `;

    return c.json({ data: note }, 201);
  });
};

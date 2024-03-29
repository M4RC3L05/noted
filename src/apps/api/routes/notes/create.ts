import { Hono } from "hono";
import vine from "@vinejs/vine";
import { sql } from "@m4rc3l05/sqlite-tag";

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

    const note = c.get("db").get(sql`
      insert into notes ${sql.insert({ content, name })}
      returning *;
    `);

    return c.json({ data: note }, 201);
  });
};

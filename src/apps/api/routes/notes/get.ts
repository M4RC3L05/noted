import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import vine from "@vinejs/vine";
import { sql } from "@m4rc3l05/sqlite-tag";

const getNoteParamsSchema = vine.object({ id: vine.string() });
const getNoteParamsValidator = vine.compile(getNoteParamsSchema);

export const get = (app: Hono) => {
  app.get("/:id", async (c) => {
    const { id } = await getNoteParamsValidator.validate(c.req.param());

    const note = c.get("db").get(sql`select * from notes where id = ${id}`);

    if (!note) {
      throw new HTTPException(404, { message: "Could not find note" });
    }

    return c.json({ data: note });
  });
};

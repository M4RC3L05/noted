import type { Hono } from "@hono/hono";
import { HTTPException } from "@hono/hono/http-exception";
import vine from "@vinejs/vine";

const deleteNoteParamsSchema = vine.object({ id: vine.string() });
const deleteNoteParamsValidator = vine.compile(deleteNoteParamsSchema);

export const del = (app: Hono) => {
  app.delete("/trashed", (c) => {
    c.get("db").exec("delete from notes where deleted_at is not null");

    return c.body(null, 204);
  });

  app.delete("/:id", async (c) => {
    const { id } = await deleteNoteParamsValidator.validate(c.req.param());

    const [result] = c.get("db")
      .sql<{ id: string }>`delete from notes where id = ${id} returning id`;

    if (!result?.id) {
      throw new HTTPException(404, { message: "Could not find note" });
    }

    return c.body(null, 204);
  });
};

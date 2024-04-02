import { Hono } from "hono";

export const del = (app: Hono) => {
  app.post("/:id/delete", async (c) => {
    const { id } = c.req.param();

    await c.get("services").notesService.deleteNote({
      id,
      signal: c.req.raw.signal,
    });

    return c.redirect(c.req.header("Referer") ?? "/");
  });
};

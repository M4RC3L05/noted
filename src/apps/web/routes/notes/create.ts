import type { Hono } from "hono";
import { notesViews } from "#src/apps/web/views/mod.ts";

export const create = (app: Hono) => {
  app.get("/create", (c) => c.html(notesViews.pages.Create()));

  app.post("/create", async (c) => {
    const data = await c.req.formData();

    const { data: note } = await c.get("services").notesService.createNote({
      data: Object.fromEntries(data),
      signal: c.req.raw.signal,
    });

    return c.redirect(`/notes/${note.id}/edit`);
  });
};

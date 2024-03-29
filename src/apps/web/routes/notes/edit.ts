import { Hono } from "hono";
import { notesViews } from "#src/apps/web/views/mod.ts";

export const edit = (app: Hono) => {
  app.get("/:id/edit", async (c) => {
    const { id } = c.req.param();
    const { data: note } = await c.get("services").notesService.getNote({
      id,
      signal: AbortSignal.any([c.get("shutdown"), c.req.raw.signal]),
    });

    return c.html(notesViews.pages.Edit({ note: note }));
  });

  app.post("/:id/edit", async (c) => {
    const { id } = c.req.param();
    const data = await c.req.formData();

    const { data: note } = await c.get("services").notesService.editNote({
      data: Object.fromEntries(data),
      id,
      signal: AbortSignal.any([c.get("shutdown"), c.req.raw.signal]),
    });

    return c.redirect(`/notes/${note.id}`);
  });
};

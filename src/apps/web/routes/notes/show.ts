import { Hono } from "hono";
import { notesViews } from "#src/apps/web/views/mod.ts";
import { parse } from "marked";

export const show = (app: Hono) => {
  app.get("/:id", async (c) => {
    const { id } = c.req.param();
    const { data: note } = await c.get("services").notesService.getNote({
      id,
      signal: AbortSignal.any([c.get("shutdown"), c.req.raw.signal]),
    });

    return c.html(
      notesViews.pages.Show({
        note: note,
        rendered: await parse(note.content ?? ""),
      }),
    );
  });
};

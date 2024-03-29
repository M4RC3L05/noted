import { Hono } from "hono";
import { notesViews } from "#src/apps/web/views/mod.ts";

export const index = (app: Hono) => {
  app.get("/", async (c) => {
    const { data: notes } = await c.get("services").notesService.getNotes({
      signal: AbortSignal.any([c.get("shutdown"), c.req.raw.signal]),
    });

    return c.html(notesViews.pages.Index({ notes: notes }));
  });
};

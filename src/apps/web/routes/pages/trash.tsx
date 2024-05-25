import type { Hono } from "hono";
import { NotesIndexPage } from "#src/apps/web/views/notes/pages/index.tsx";

export const trash = (app: Hono) => {
  app.get("/trash", async (c) => {
    const { data: notes } = await c.get("services").notesService.getNotes({
      signal: c.req.raw.signal,
      trashed: true,
    });

    return c.render(<NotesIndexPage notes={notes} trash={true} />);
  });

  app.post("/trash/delete", async (c) => {
    await c.get("services").notesService.deleteTrashed({
      signal: c.req.raw.signal,
    });

    return c.redirect(c.req.header("Referer") ?? "/");
  });
};

import type { Hono } from "hono";
import { NotesIndexPage } from "#src/apps/web/views/notes/pages/index.tsx";

export const index = (app: Hono) => {
  app.get("/", async (c) => {
    const { data: notes } = await c.get("services").notesService.getNotes({
      signal: c.req.raw.signal,
      trashed: false,
    });

    return c.render(<NotesIndexPage notes={notes} trash={false} />);
  });
};

import type { Hono } from "hono";
import { NotesCreatePage } from "#src/apps/web/views/notes/pages/create.tsx";

export const create = (app: Hono) => {
  app.get("/create", (c) => c.render(<NotesCreatePage />));

  app.post("/create", async (c) => {
    const data = await c.req.formData();

    const { data: note } = await c.get("services").notesService.createNote({
      data: Object.fromEntries(data),
      signal: c.req.raw.signal,
    });

    return c.redirect(`/notes/${note.id}/edit`);
  });
};

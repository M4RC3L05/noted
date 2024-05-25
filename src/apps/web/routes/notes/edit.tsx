import type { Hono } from "hono";
import { NotesEditPage } from "#src/apps/web/views/notes/pages/edit.tsx";

export const edit = (app: Hono) => {
  app.get("/:id/edit", async (c) => {
    const { id } = c.req.param();
    const { data: note } = await c.get("services").notesService.getNote({
      id,
      signal: c.req.raw.signal,
    });

    return c.render(<NotesEditPage note={note} />);
  });

  app.post("/:id/edit", async (c) => {
    const { id } = c.req.param();
    const data = await c.req.formData();

    const { data: note } = await c.get("services").notesService.editNote({
      data: Object.fromEntries(data),
      id,
      signal: c.req.raw.signal,
    });

    if (!data.has("delete")) {
      return c.redirect(`/notes/${note.id}`);
    }

    return c.redirect(c.req.header("Referer") ?? "/");
  });
};

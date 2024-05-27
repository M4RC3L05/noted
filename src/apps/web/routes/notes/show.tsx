import type { Hono } from "@hono/hono";
import { parse } from "marked";
import { NotesShowPage } from "#src/apps/web/views/notes/pages/show.tsx";

export const show = (app: Hono) => {
  app.get("/:id", async (c) => {
    const { id } = c.req.param();
    const { data: note } = await c.get("services").notesService.getNote({
      id,
      signal: c.req.raw.signal,
    });

    return c.render(
      <NotesShowPage note={note} rendered={await parse(note.content ?? "")} />,
    );
  });
};

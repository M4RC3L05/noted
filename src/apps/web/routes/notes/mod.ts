import { Hono } from "hono";
import { create } from "#src/apps/web/routes/notes/create.tsx";
import { edit } from "#src/apps/web/routes/notes/edit.tsx";
import { show } from "#src/apps/web/routes/notes/show.tsx";
import { del } from "#src/apps/web/routes/notes/delete.ts";
import { exportNotes } from "#src/apps/web/routes/notes/export.ts";

export const notesRoutes = () => {
  const router = new Hono();

  create(router);
  edit(router);
  exportNotes(router);
  show(router);
  del(router);

  return router;
};

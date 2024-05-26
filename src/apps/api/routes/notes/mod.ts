import { Hono } from "hono";
import { all } from "#src/apps/api/routes/notes/all.ts";
import { get } from "#src/apps/api/routes/notes/get.ts";
import { create } from "#src/apps/api/routes/notes/create.ts";
import { patch } from "#src/apps/api/routes/notes/patch.ts";
import { del } from "#src/apps/api/routes/notes/delete.ts";
import { exportNotes } from "#src/apps/api/routes/notes/export.ts";

export const notesRoutes = () => {
  const router = new Hono();

  all(router);
  exportNotes(router);
  get(router);
  create(router);
  patch(router);
  del(router);

  return router;
};

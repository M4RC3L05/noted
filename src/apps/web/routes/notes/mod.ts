import { Hono } from "hono";
import { create } from "#src/apps/web/routes/notes/create.ts";
import { edit } from "#src/apps/web/routes/notes/edit.ts";
import { show } from "#src/apps/web/routes/notes/show.ts";
import { del } from "#src/apps/web/routes/notes/delete.ts";

export const notesRoutes = () => {
  const router = new Hono();

  create(router);
  edit(router);
  show(router);
  del(router);

  return router;
};

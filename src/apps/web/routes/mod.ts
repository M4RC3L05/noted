import { Hono } from "hono";
import { pagesRoutes } from "#src/apps/web/routes/pages/mod.ts";
import { notesRoutes } from "#src/apps/web/routes/notes/mod.ts";

export const router = () => {
  return new Hono().route("/", pagesRoutes()).route("/notes", notesRoutes());
};

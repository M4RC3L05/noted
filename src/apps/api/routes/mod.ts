import { Hono } from "hono";
import { notesRoutes } from "#src/apps/api/routes/notes/mod.ts";

export const router = () => {
  return new Hono().route("/notes", notesRoutes());
};

import { Hono } from "hono";
import { notesRoutes } from "./notes/mod.ts";

export const router = () => {
  return new Hono().route("/notes", notesRoutes());
};

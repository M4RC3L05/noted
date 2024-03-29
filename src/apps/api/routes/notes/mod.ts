import { Hono } from "hono";
import { all } from "./all.ts";
import { get } from "./get.ts";
import { create } from "./create.ts";
import { patch } from "./patch.ts";
import { del } from "./delete.ts";

export const notesRoutes = () => {
  const router = new Hono();

  all(router);
  get(router);
  create(router);
  patch(router);
  del(router);

  return router;
};

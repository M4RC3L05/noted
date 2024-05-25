import { Hono } from "hono";
import { index } from "#src/apps/web/routes/pages/index.tsx";
import { trash } from "#src/apps/web/routes/pages/trash.tsx";

export const pagesRoutes = () => {
  const router = new Hono();

  index(router);
  trash(router);

  return router;
};

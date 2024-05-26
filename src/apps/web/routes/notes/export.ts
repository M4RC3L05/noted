import type { Hono } from "hono";

export const exportNotes = (router: Hono) => {
  router.get("/export", async (c) => {
    const response = await c.get("services").notesService.export({
      signal: c.req.raw.signal,
    });

    c.header("content-type", response.headers.get("content-type") ?? "");
    c.header(
      "content-disposition",
      response.headers.get("content-disposition") ?? "",
    );

    return c.body(response.body);
  });
};

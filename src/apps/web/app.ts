import { Hono, HTTPException } from "hono";
import { basicAuth, secureHeaders } from "hono/middleware.ts";
import config from "config";
import { makeLogger } from "../../common/logger/mod.ts";
import { notesViews } from "./views/mod.ts";
import { parse } from "marked";
import { NotesService } from "./services/notes-service.ts";

declare module "hono" {
  interface ContextVariableMap {
    shutdown: AbortSignal;
    services: {
      notesService: NotesService;
    };
  }
}

const log = makeLogger("web");
const basicAuthConfig = config.get("apps.web.basicAuth");
const servicesConfig = config.get("apps.web.services");

export const makeApp = (
  { signal }: { signal: AbortSignal },
) => {
  const app = new Hono();

  app.onError((error, c) => {
    log.error("Something went wrong!", { error });

    if (error instanceof HTTPException) {
      if (error.res) {
        error.res.headers.forEach((value, key) => {
          c.header(key, value);
        });
      }
    }

    // Redirect back on request that alter the application state.
    if (!["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
      return c.redirect(c.req.header("Referer") ?? "/");
    }

    return c.text(
      error.message ?? "Something broke",
      // deno-lint-ignore no-explicit-any
      (error as any).status ?? 500,
    );
  });

  app.notFound(() => {
    throw new HTTPException(404, { message: "Route not found" });
  });

  app.use("*", (c, next) => {
    c.set("shutdown", signal);
    c.set("services", {
      notesService: new NotesService(
        servicesConfig.api.url,
        servicesConfig.api.basicAuth,
      ),
    });

    return next();
  });

  app.use(
    "*",
    secureHeaders({ referrerPolicy: "strict-origin-when-cross-origin" }),
  );
  app.use("*", async (c, next) => {
    try {
      await next();
    } finally {
      // This is important so that we always make sure the browser will not cache the previous page
      // so that the requests are always made.
      c.header("cache-control", "no-cache, no-store, must-revalidate");
      c.header("pragma", "no-cache");
      c.header("expires", "0");
    }
  });
  app.use("*", basicAuth({ ...basicAuthConfig }));

  app.get("/", async (c) => {
    const { data: notes } = await c.get("services").notesService.getNotes({
      signal: AbortSignal.any([c.get("shutdown"), c.req.raw.signal]),
    });

    return c.html(notesViews.pages.Index({ notes: notes }));
  });
  app.get("/notes/create", (c) => c.html(notesViews.pages.Create()));
  app.post("/notes/create", async (c) => {
    const data = await c.req.formData();

    const { data: note } = await c.get("services").notesService.createNote({
      data: Object.fromEntries(data),
      signal: AbortSignal.any([c.get("shutdown"), c.req.raw.signal]),
    });

    return c.redirect(`/notes/${note.id}/edit`);
  });
  app.get("/notes/:id/edit", async (c) => {
    const { id } = c.req.param();
    const { data: note } = await c.get("services").notesService.getNote({
      id,
      signal: AbortSignal.any([c.get("shutdown"), c.req.raw.signal]),
    });

    return c.html(notesViews.pages.Edit({ note: note }));
  });
  app.post("/notes/:id/edit", async (c) => {
    const { id } = c.req.param();
    const data = await c.req.formData();

    const { data: note } = await c.get("services").notesService.editNote({
      data: Object.fromEntries(data),
      id,
      signal: AbortSignal.any([c.get("shutdown"), c.req.raw.signal]),
    });

    return c.redirect(`/notes/${note.id}`);
  });
  app.get("/notes/:id", async (c) => {
    const { id } = c.req.param();
    const { data: note } = await c.get("services").notesService.getNote({
      id,
      signal: AbortSignal.any([c.get("shutdown"), c.req.raw.signal]),
    });

    return c.html(
      notesViews.pages.Show({
        note: note,
        rendered: await parse(note.content ?? ""),
      }),
    );
  });
  app.post("/notes/:id/delete", async (c) => {
    const { id } = c.req.param();

    await c.get("services").notesService.deleteNote({
      id,
      signal: AbortSignal.any([c.get("shutdown"), c.req.raw.signal]),
    });

    return c.redirect(c.req.header("Referer") ?? "/");
  });

  return app;
};

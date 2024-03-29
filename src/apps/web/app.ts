import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { basicAuth } from "hono/basic-auth";
import { secureHeaders } from "hono/secure-headers";
import { serveStatic } from "hono/deno";
import config from "config";
import { makeLogger } from "#src/common/logger/mod.ts";
import { NotesService } from "#src/apps/web/services/mod.ts";
import { router } from "#src/apps/web/routes/mod.ts";

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
  const services = {
    notesService: new NotesService(
      servicesConfig.api.url,
      servicesConfig.api.basicAuth,
    ),
  };

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
    c.set("services", services);

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
  app.use(
    "/favicon.ico",
    serveStatic({ path: "./src/apps/web/public/favicon.ico" }),
  );

  return app.route("/", router());
};

import { Hono } from "hono";
import { CustomDatabase } from "../../database/mod.ts";
import { basicAuth } from "hono/basic-auth";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import config from "config";
import { errorMapper } from "#src/common/middlewares/mod.ts";
import { errorMappers } from "#src/common/errors/mod.ts";
import { router } from "#src/apps/api/routes/mod.ts";

declare module "hono" {
  interface ContextVariableMap {
    shutdown: AbortSignal;
    db: CustomDatabase;
  }
}

const basicAuthConfig = config.get("apps.api.basicAuth");

export const makeApp = (
  { db, signal }: { db: CustomDatabase; signal: AbortSignal },
) => {
  const app = new Hono();

  app.onError(errorMapper({ defaultMapper: errorMappers.defaultErrorMapper }));

  app.notFound((c) =>
    c.json({ error: { code: "not-found", message: "Not found" } }, 404)
  );

  app.use("*", (c, next) => {
    c.set("shutdown", signal);
    c.set("db", db);

    return next();
  });

  app.use("*", secureHeaders());
  app.use("*", cors());
  app.use("*", basicAuth({ ...basicAuthConfig }));

  return app.route("/api", router());
};

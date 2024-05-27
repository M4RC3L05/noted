import { type ContextVariableMap, Hono } from "@hono/hono";
import { basicAuth } from "@hono/hono/basic-auth";
import { secureHeaders } from "@hono/hono/secure-headers";
import { cors } from "@hono/hono/cors";
import config from "config";
import { errorMapper, serviceRegister } from "#src/common/middlewares/mod.ts";
import { errorMappers } from "#src/common/errors/mod.ts";
import { router } from "#src/apps/api/routes/mod.ts";
import { HTTPException } from "@hono/hono/http-exception";
import type { CustomDatabase } from "#src/database/mod.ts";

declare module "@hono/hono" {
  interface ContextVariableMap {
    shutdown: AbortSignal;
    db: CustomDatabase;
  }
}

const basicAuthConfig = config.get("apps.api.basicAuth");

export const makeApp = (
  deps: Partial<ContextVariableMap>,
) => {
  const app = new Hono();

  app.onError(errorMapper({ defaultMapper: errorMappers.defaultErrorMapper }));

  app.notFound(() => {
    throw new HTTPException(404, { message: "Route not found" });
  });

  app.use("*", serviceRegister(deps));
  app.use("*", secureHeaders());
  app.use("*", cors());
  app.use("*", basicAuth({ ...basicAuthConfig }));

  return app.route("/api", router());
};

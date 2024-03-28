import { Hono, HTTPException } from "hono";
import { basicAuth, secureHeaders } from "hono/middleware";
import config from "config";
import { makeLogger } from "../../common/logger/mod.ts";

declare module "hono" {
  interface ContextVariableMap {
    shutdown: AbortSignal;
  }
}

const log = makeLogger("web");
const basicAuthConfig = config.get("apps.web.basicAuth");

export const makeApp = (
  { signal }: { signal: AbortSignal },
) => {
  const app = new Hono();

  app.onError((error, c) => {
    log.error("Something went wrong!", { error });

    if (error instanceof HTTPException) {
      if (error.res) {
        for (const [key, value] of error.res.headers.entries()) {
          c.header(key, value);
        }
      }
    }

    return c.text(
      error.message ?? "Something broke",
      (error as any).status ?? 500,
    );
  });

  app.notFound(() => {
    throw new HTTPException(404, { message: "Route not found" });
  });

  app.use("*", (c, next) => {
    c.set("shutdown", signal);

    return next();
  });

  app.use("*", secureHeaders());
  app.use("*", basicAuth({ ...basicAuthConfig }));

  return app;
};

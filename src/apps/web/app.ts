import { Hono, HTTPException } from "hono";
import { basicAuth, secureHeaders } from "hono/middleware.ts";
import config from "config";
import { makeLogger } from "../../common/logger/mod.ts";
import { notesViews } from "./views/mod.ts";
import { encodeBase64 } from "@std/encoding/base64";
import { parse } from "marked";

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
        error.res.headers.forEach((value, key) => {
          c.header(key, value);
        });
      }
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

    return next();
  });

  app.use("*", secureHeaders());
  app.use("*", basicAuth({ ...basicAuthConfig }));

  app.get("/", async (c) => {
    const { data: notes } = await fetch("http://127.0.0.1:4321/api/notes", {
      headers: {
        "authorization": `Basic ${
          encodeBase64(
            `${basicAuthConfig.username}:${basicAuthConfig.password}`,
          )
        }`,
      },
    }).then((response) => response.json());

    return c.html(notesViews.pages.Index({ notes: notes }));
  });
  app.get("/notes/:id", async (c) => {
    const { id } = c.req.param();
    const { data: note } = await fetch(
      `http://127.0.0.1:4321/api/notes/${id}`,
      {
        headers: {
          "authorization": `Basic ${
            encodeBase64(
              `${basicAuthConfig.username}:${basicAuthConfig.password}`,
            )
          }`,
        },
      },
    ).then((response) => response.json());

    return c.html(
      notesViews.pages.Show({
        note: note,
        rendered: await parse(note.content ?? ""),
      }),
    );
  });

  return app;
};

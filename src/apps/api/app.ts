import { Hono, HTTPException } from "hono";
import { CustomDatabase } from "../../database/mod.ts";
import { sql } from "@m4rc3l05/sqlite-tag";
import { z } from "zod";
import { basicAuth, cors } from "hono/middleware.ts";
import config from "config";
import { errorMapper } from "../../common/middlewares/mod.ts";
import { errorMappers } from "../../common/errors/mod.ts";

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

  app.use("*", cors());
  app.use("*", basicAuth({ ...basicAuthConfig }));
  app.get("/api/notes", (c) => {
    const { includeDeleted } = z.object({
      includeDeleted: z.string().optional(),
    }).strict().parse(c.req.query());

    const notes = c.get("db").all(
      sql`
        select
          id, name, created_at, updated_at ${
        sql.if(typeof includeDeleted === "string", () => sql`,deleted_at`)
      }
        from notes
        ${
        sql.if(typeof includeDeleted !== "string", () =>
          sql`where deleted_at is null`)
      }
        order by updated_at desc`,
    );

    return c.json({ data: notes });
  });

  app.get("/api/notes/:id", (c) => {
    const { id } = z.object({ id: z.string() }).strict().parse(c.req.param());

    const note = c.get("db").get(sql`select * from notes where id = ${id}`);

    if (!note) {
      throw new HTTPException(404, { message: "Could not find note" });
    }

    return c.json({ data: note });
  });

  app.post("/api/notes", async (c) => {
    const { content, name } = z.object({
      name: z.string(),
      content: z.string().optional(),
    })
      .strict().parse(await c.req.json());

    const note = c.get("db").get(sql`
      insert into notes ${sql.insert({ content, name })}
      returning *;
    `);

    return c.json({ data: note }, 201);
  });

  app.patch(
    "/api/notes/:id",
    async (c) => {
      const { id } = z.object({ id: z.string() }).strict().parse(c.req.param());
      const { content, name, delete: del } = z.object({
        name: z.string().optional(),
        content: z.string().optional(),
        delete: z.boolean().optional(),
      })
        .strict().superRefine((data, ctx) => {
          if (Object.keys(data).length <= 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "At least one prop must be provided",
            });
          }
        }).parse(await c.req.json());

      const note = c.get("db").get(sql`
        update notes
        set
          ${sql.if(typeof name === "string", () => sql`name = ${name}`)}
          ${
        sql.if(typeof content === "string", () => sql`,content = ${content}`)
      }
          ${
        sql.if(typeof del === "boolean", () =>
          sql`deleted_at = ${del ? new Date().toISOString() : null}`)
      }
        where id = ${id}
        returning *;
      `);

      return c.json({ data: note });
    },
  );

  app.delete("/api/notes/:id", (c) => {
    const { id } = z.object({ id: z.string() }).strict().parse(c.req.param());

    const result = c.get("db").execute(sql`delete from notes where id = ${id}`);

    if (result <= 0) {
      throw new HTTPException(404, { message: "Could not find note" });
    }

    return c.body(null, 204);
  });

  return app;
};

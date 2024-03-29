import { Hono, HTTPException } from "hono";
import { CustomDatabase } from "../../database/mod.ts";
import { sql } from "@m4rc3l05/sqlite-tag";
import { basicAuth, cors } from "hono/middleware.ts";
import config from "config";
import { errorMapper } from "../../common/middlewares/mod.ts";
import { errorMappers } from "../../common/errors/mod.ts";
import vine from "@vinejs/vine";

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

  const getNotesQuerySchema = vine.object({
    includeDeleted: vine.string().optional(),
  });
  const getNotesQueryValidator = vine.compile(getNotesQuerySchema);
  app.get("/api/notes", async (c) => {
    const { includeDeleted } = await getNotesQueryValidator.validate(
      c.req.query(),
    );

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

  const getNoteParamsSchema = vine.object({ id: vine.string() });
  const getNoteParamsValidator = vine.compile(getNoteParamsSchema);
  app.get("/api/notes/:id", async (c) => {
    const { id } = await getNoteParamsValidator.validate(c.req.param());

    const note = c.get("db").get(sql`select * from notes where id = ${id}`);

    if (!note) {
      throw new HTTPException(404, { message: "Could not find note" });
    }

    return c.json({ data: note });
  });

  const createNoteBodySchema = vine.object({
    name: vine.string().minLength(1).trim(),
    content: vine.string().optional(),
  });
  const createNoteBodyValidator = vine.compile(createNoteBodySchema);
  app.post("/api/notes", async (c) => {
    const { content, name } = await createNoteBodyValidator.validate(
      await c.req.json(),
    );

    const note = c.get("db").get(sql`
      insert into notes ${sql.insert({ content, name })}
      returning *;
    `);

    return c.json({ data: note }, 201);
  });

  const editNoteParamsSchema = vine.object({ id: vine.string() });
  const editNoteParamsValidator = vine.compile(editNoteParamsSchema);
  const editNoteBodySchema = vine.object({
    name: vine.string().minLength(1).trim().optional().requiredIfMissing([
      "content",
      "delete",
    ]),
    content: vine.string().optional().requiredIfMissing(["name", "delete"]),
    delete: vine.boolean().optional().requiredIfMissing(["name", "content"]),
  });
  const editNoteBodyValidator = vine.compile(editNoteBodySchema);
  app.patch(
    "/api/notes/:id",
    async (c) => {
      const { id } = await editNoteParamsValidator.validate(c.req.param());
      const { content, name, delete: del } = await editNoteBodyValidator
        .validate(await c.req.json());

      const note = c.get("db").get(sql`
        update notes
        set ${
        sql.set({
          name,
          content,
          deleted_at: typeof del === "boolean"
            ? del ? new Date().toISOString() : null
            : undefined,
        })
      }
        where id = ${id}
        returning *;
      `);

      return c.json({ data: note });
    },
  );

  const deleteNoteParamsSchema = vine.object({ id: vine.string() });
  const deleteNoteParamsValidator = vine.compile(deleteNoteParamsSchema);
  app.delete("/api/notes/:id", async (c) => {
    const { id } = await deleteNoteParamsValidator.validate(c.req.param());

    const result = c.get("db").execute(sql`delete from notes where id = ${id}`);

    if (result <= 0) {
      throw new HTTPException(404, { message: "Could not find note" });
    }

    return c.body(null, 204);
  });

  return app;
};

import { type CustomDatabase, makeDatabase } from "#src/database/mod.ts";
import { makeApp } from "#src/apps/api/app.ts";
import { encodeBase64 } from "@std/encoding/base64";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import type { Hono } from "@hono/hono";
import { testDbUtils } from "#src/common/utils/mod.ts";

let db: CustomDatabase;
let app: Hono;

beforeAll(async () => {
  db = makeDatabase();
  await testDbUtils.runMigrations(db);

  app = makeApp({ db });
});

beforeEach(() => {
  db.exec("delete from notes");
});

afterAll(() => {
  db.close();
});

describe("POST /api/notes", () => {
  it("should throw a validation error if not data is provided", async () => {
    const response = await app.request("/api/notes", {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "content-type": "application/json",
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.json();

    assertEquals(response.status, 422);
    assertEquals(data, {
      error: {
        code: "error",
        message: "Validation failed",
        validationErrors: [{
          message: "The name field must be defined",
          rule: "required",
          field: "name",
        }],
      },
    });
  });

  it("should throw a validation error if data is invalid", async () => {
    const response = await app.request("/api/notes", {
      method: "POST",
      body: JSON.stringify({ name: 1, content: true }),
      headers: {
        "content-type": "application/json",
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.json();

    assertEquals(response.status, 422);
    assertEquals(data, {
      error: {
        code: "error",
        message: "Validation failed",
        validationErrors: [{
          message: "The name field must be a string",
          rule: "string",
          field: "name",
        }, {
          message: "The content field must be a string",
          rule: "string",
          field: "content",
        }],
      },
    });
  });

  it("should create a note without content", async () => {
    const response = await app.request("/api/notes", {
      method: "POST",
      body: JSON.stringify({ name: "foo" }),
      headers: {
        "content-type": "application/json",
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.json();
    const [{ content, ...note }] = db
      .sql`select 
        id, name, content, deleted_at as "deletedAt", created_at as "createdAt", updated_at as "updatedAt" 
        from notes 
        where id = ${data.data.id}`;

    assertEquals(response.status, 201);
    assertEquals(data, { data: note });
    assertEquals(content, null);
  });

  it("should create a note with content", async () => {
    const response = await app.request("/api/notes", {
      method: "POST",
      body: JSON.stringify({ name: "foo", content: "bar" }),
      headers: {
        "content-type": "application/json",
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.json();
    const [{ content, ...note }] = db
      .sql`select 
        id, name, content, deleted_at as "deletedAt", created_at as "createdAt", updated_at as "updatedAt" 
        from notes 
        where id = ${data.data.id}`;

    assertEquals(response.status, 201);
    assertEquals(data, { data: note });
    assertEquals(content, "bar");
  });
});

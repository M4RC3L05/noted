import { type CustomDatabase, makeDatabase } from "#src/database/mod.ts";
import { makeApp } from "#src/apps/api/app.ts";
import * as testFixtures from "#src/common/test-fixtures/mod.ts";
import { encodeBase64 } from "@std/encoding/base64";
import type { Hono } from "@hono/hono";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "@std/testing/bdd";
import { assertEquals, assertNotEquals } from "@std/assert";
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

describe("PATCH /api/notes/:id", () => {
  it("should throw a 422 if patch data in not provided", async () => {
    const response = await app.request("/api/notes/foo", {
      method: "PATCH",
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
          field: "name",
          message: "The name field must be defined",
          rule: "required",
        }, {
          field: "content",
          message: "The content field must be defined",
          rule: "required",
        }, {
          field: "delete",
          message: "The delete field must be defined",
          rule: "required",
        }],
      },
    });
  });

  it("should throw a 422 if patch data in not valid", async () => {
    const response = await app.request("/api/notes/foo", {
      method: "PATCH",
      body: JSON.stringify({ name: 1, content: true, delete: "foobar" }),
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
          field: "name",
          message: "The name field must be a string",
          rule: "string",
        }, {
          field: "content",
          message: "The content field must be a string",
          rule: "string",
        }, {
          field: "delete",
          message: "The value must be a boolean",
          rule: "boolean",
        }],
      },
    });
  });

  it("should throw 404 if note was not found", async () => {
    const response = await app.request("/api/notes/foo", {
      method: "PATCH",
      body: JSON.stringify({ name: "foo" }),
      headers: {
        "content-type": "application/json",
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.json();

    assertEquals(response.status, 404);
    assertEquals(data, {
      error: {
        code: "error",
        message: "Could not find note",
      },
    });
  });

  it("should not override content if not provided", async () => {
    const note = testFixtures.loadNote(db, { content: "foo" });
    const response = await app.request(`/api/notes/${note.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: "a" }),
      headers: {
        "content-type": "application/json",
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data.data.content, "foo");
  });

  it("should patch a note by id", async () => {
    const note = testFixtures.loadNote(db, { content: "foo", name: "bar" });
    const response = await app.request(`/api/notes/${note.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: "a" }),
      headers: {
        "content-type": "application/json",
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.json();

    const [patchNote] = db
      .sql`select updated_at as "updatedAt" from notes where id = ${note.id}`;

    assertEquals(response.status, 200);
    assertEquals(data, {
      data: { ...note, ...patchNote, name: "a", content: "foo" },
    });
  });

  it("should trash a note", async () => {
    const note = testFixtures.loadNote(db, { content: "foo", name: "bar" });
    const response = await app.request(`/api/notes/${note.id}`, {
      method: "PATCH",
      body: JSON.stringify({ delete: true }),
      headers: {
        "content-type": "application/json",
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.json();

    const [patchNote] = db
      .sql`select deleted_at as "deletedAt", updated_at as "updatedAt" from notes where id = ${note.id}`;

    assertEquals(response.status, 200);
    assertEquals(data, {
      data: { ...note, ...patchNote, name: "bar", content: "foo" },
    });
    assertNotEquals(data.data.deletedAt, null);
  });

  it("should untrash a note", async () => {
    const note = testFixtures.loadNote(db, {
      content: "foo",
      name: "bar",
      deletedAt: new Date().toISOString(),
    });
    const response = await app.request(`/api/notes/${note.id}`, {
      method: "PATCH",
      body: JSON.stringify({ delete: false }),
      headers: {
        "content-type": "application/json",
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.json();

    const [patchNote] = db
      .sql`select deleted_at as "deletedAt", updated_at as "updatedAt" from notes where id = ${note.id}`;

    assertEquals(response.status, 200);
    assertEquals(data, {
      data: { ...note, ...patchNote, name: "bar", content: "foo" },
    });
    assertEquals(data.data.deletedAt, null);
  });
});

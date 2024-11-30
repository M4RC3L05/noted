import { type CustomDatabase, makeDatabase } from "#src/database/mod.ts";
import { makeApp } from "#src/apps/api/app.ts";
import * as testFixtures from "#src/common/test-fixtures/mod.ts";
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

describe("GET /api/notes/:id", () => {
  it("should throw a 404 if note was not found", async () => {
    const response = await app.request("/api/notes/foo", {
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.json();

    assertEquals(response.status, 404);
    assertEquals(data, {
      error: { code: "error", message: "Could not find note" },
    });
  });

  it("should get a note by id", async () => {
    const note = testFixtures.loadNote(db);
    testFixtures.loadNote(db);

    const response = await app.request(`/api/notes/${note.id}`, {
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data, { data: note });
  });
});

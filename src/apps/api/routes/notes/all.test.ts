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
import { assertEquals, assertNotEquals } from "@std/assert";
import type { Hono } from "@hono/hono";

let db: CustomDatabase;
let app: Hono;

beforeAll(() => {
  db = makeDatabase();
  app = makeApp({ db });
});

beforeEach(() => {
  db.exec("delete from notes");
});

afterAll(() => {
  db.close();
});

describe("GET /api/notes", () => {
  it("should return all notes not in trash", async () => {
    const { content: _, ...note } = testFixtures.loadNote(db);
    testFixtures.loadNote(db, { deletedAt: new Date().toISOString() });

    const response = await app.request("/api/notes", {
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data, { data: [note] });
    assertEquals(data.data[0].deletedAt, null);
  });

  it("should return all notes in trash", async () => {
    testFixtures.loadNote(db);
    const { content: _, ...note } = testFixtures.loadNote(db, {
      deletedAt: new Date().toISOString(),
    });

    const response = await app.request("/api/notes?trashed=true", {
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });
    const data = await response.json();

    assertEquals(response.status, 200);
    assertEquals(data, { data: [note] });
    assertNotEquals(data.data[0].deletedAt, null);
  });
});

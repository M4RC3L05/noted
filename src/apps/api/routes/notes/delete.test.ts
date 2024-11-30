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

describe("DELETE /api/notes/trashed", () => {
  it("should delete all trashed notes", async () => {
    const note = testFixtures.loadNote(db);
    testFixtures.loadNote(db, { deletedAt: new Date().toISOString() });
    testFixtures.loadNote(db, { deletedAt: new Date().toISOString() });

    const notesBefore = db.sql`select id from notes;`;
    assertEquals(notesBefore.length, 3);

    const response = await app.request("/api/notes/trashed", {
      method: "DELETE",
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });

    const data = await response.bytes();
    const notes = db.sql`select id from notes;`;

    assertEquals(response.status, 204);
    assertEquals(data.length, 0);
    assertEquals(notes, [{ id: note.id }]);
  });
});

describe("DELETE /api/notes/:id", () => {
  it("should throw 404 if not note was found", async () => {
    const response = await app.request("/api/notes/foo", {
      method: "DELETE",
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

  it("should delete a given note by id", async () => {
    const note = testFixtures.loadNote(db);
    const notDeletedNote = testFixtures.loadNote(db);

    const notesBefore = db.sql`select id from notes;`;
    assertEquals(notesBefore.length, 2);

    const response = await app.request(`/api/notes/${note.id}`, {
      method: "DELETE",
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });

    const data = await response.bytes();
    const notes = db.sql`select id from notes;`;

    assertEquals(response.status, 204);
    assertEquals(data.length, 0);
    assertEquals(notes, [{ id: notDeletedNote.id }]);
  });
});

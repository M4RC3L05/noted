import { type CustomDatabase, makeDatabase } from "#src/database/mod.ts";
import { makeApp } from "#src/apps/api/app.ts";
import * as testFixtures from "#src/common/test-fixtures/mod.ts";
import { UntarStream } from "@std/tar/untar-stream";
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

describe("GET /api/notes/export", () => {
  it("should export all notes", async () => {
    const note = testFixtures.loadNote(db, { name: "foo" });
    const trashedNote = testFixtures.loadNote(db, {
      deletedAt: new Date().toISOString(),
      name: "bar",
    });

    const response = await app.request("/api/notes/export", {
      headers: {
        "authorization": `Basic ${encodeBase64("foo:bar")}`,
      },
    });

    assertEquals(response.headers.get("content-type"), "application/x-tar");
    assertEquals(
      response.headers.get("content-disposition"),
      'attachment; filename="notes.tar"',
    );
    assertEquals(response.status, 200);

    const data: string[] = [];

    for await (const entry of response.body!.pipeThrough(new UntarStream())) {
      data.push(entry.path);
      entry.readable?.cancel();
    }

    assertEquals(
      data.sort(),
      [`/trashed/${trashedNote.name}.txt`, `/notes/${note.name}.txt`].sort(),
    );
  });
});

import type { Hono } from "hono";
import { sql } from "@m4rc3l05/sqlite-tag";
import { Tar } from "@std/archive";
import { Buffer } from "@std/io/buffer";
import { toReadableStream } from "jsr:@std/io@^0.224.0/to-readable-stream";
import type { NotesTable } from "#src/database/types/mod.ts";

export const exportNotes = (app: Hono) => {
  app.get("/export", (c) => {
    const tar = new Tar();
    const textEncoder = new TextEncoder();
    const notes = c.get("db").getPrepared<NotesTable>(sql`select * from notes`);

    for (const note of notes) {
      const encoded = textEncoder.encode(note.content);
      const tarPath = note.deletedAt !== null
        ? `/trashed/${note.name}.txt`
        : `/notes/${note.name}.txt`;

      tar.append(tarPath, {
        reader: new Buffer(encoded),
        contentSize: encoded.byteLength,
      });
    }

    return c.body(toReadableStream(tar.getReader()), 200, {
      "content-type": "application/x-tar",
      "content-disposition": 'attachment; filename="notes.tar"',
    });
  });
};

import type { Hono } from "@hono/hono";
import { sql } from "@m4rc3l05/sqlite-tag";
import { TarStream, type TarStreamInput } from "@std/tar/tar-stream";
import type { NotesTable } from "#src/database/types/mod.ts";

export const exportNotes = (app: Hono) => {
  app.get("/export", (c) => {
    const textEncoder = new TextEncoder();
    const notes = c.get("db").iter<NotesTable>(sql`select * from notes`);
    const input: TarStreamInput[] = [];

    for (const note of notes) {
      const encoded = textEncoder.encode(note.content);
      const tarPath = note.deletedAt !== null
        ? `/trashed/${note.name}.txt`
        : `/notes/${note.name}.txt`;

      input.push({
        readable: ReadableStream.from([encoded]),
        path: tarPath,
        size: encoded.byteLength,
        type: "file",
      });
    }

    return c.body(
      ReadableStream.from(input).pipeThrough(new TarStream()),
      200,
      {
        "content-type": "application/x-tar",
        "content-disposition": 'attachment; filename="notes.tar"',
      },
    );
  });
};

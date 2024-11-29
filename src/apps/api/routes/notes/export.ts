import type { Hono } from "@hono/hono";
import { TarStream, type TarStreamInput } from "@std/tar/tar-stream";
import type { NotesTable } from "#src/database/types/mod.ts";

export const exportNotes = (app: Hono) => {
  app.get("/export", (c) => {
    const textEncoder = new TextEncoder();
    const notes = c.get("db").prepare(
      `select 
        id, name, content, deleted_at as "deletedAt", created_at as "createdAt", updated_at as "updatedAt"
      from notes`,
    )
      .iter() as IterableIterator<NotesTable>;
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

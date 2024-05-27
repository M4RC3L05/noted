import type { FC } from "@hono/hono/jsx";
import type { NotesTable } from "#src/database/types/mod.ts";

type NotesShowPageProps = {
  note: NotesTable;
  rendered: string;
};

export const NotesShowPage: FC<NotesShowPageProps> = ({ note, rendered }) => (
  <>
    <header>
      <nav>
        <a href="/">Home</a>
        <a href="/trash">Trash 🗑</a>
      </nav>

      <h1>{note.name}</h1>
    </header>

    <header
      id="header-actions"
      style="position: sticky; top: 0; z-index: 2; padding: 0px;"
    >
      <a href={`/notes/${note.id}/edit`} class="button">Edit note ✏</a>
    </header>

    <main>
      <article dangerouslySetInnerHTML={{ __html: rendered }} />
    </main>
  </>
);

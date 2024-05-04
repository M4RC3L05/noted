import type { FC } from "hono/jsx";
import type { NotesTable } from "#src/database/types/mod.ts";

type NotesIndexPageProps = {
  notes: Omit<NotesTable, "content">[];
};

const ArticleItem: FC<{ note: NotesIndexPageProps["notes"][0] }> = (
  { note },
) => (
  <article>
    <h2>{note.name}</h2>

    <div style="display: flex" class="note-actions">
      <a class="button" href="/notes/${note.id}" style="margin-right: 8px">
        Show
      </a>

      <dialog id={`dialog-${note.id}`}>
        <p>Are you sure you want to delete note "{note.name}"?</p>

        <form
          style="display: inline; margin-right: 8px"
          action={`/notes/${note.id}/delete`}
          method="post"
        >
          <button type="submit">
            Yes
          </button>
        </form>

        <form method="dialog" style="display: inline">
          <button>No</button>
        </form>
      </dialog>

      <button
        style="display: inline; margin-right: 8px"
        onclick={`getElementById("dialog-${note.id}").show()`}
      >
        Delete ⨯?
      </button>
    </div>
  </article>
);

export const NotesIndexPage: FC<NotesIndexPageProps> = ({ notes }) => (
  <>
    <header>
      <h1>Noted</h1>
    </header>

    <header
      id="header-actions"
      style="position: sticky; top: 0; z-index: 2; padding: 0px;"
    >
      <a href="/notes/create" class="button">Add note +</a>
    </header>

    <main>
      {notes.map((note) => <ArticleItem note={note} />)}
      {notes.length <= 0 ? <p>No notes</p> : undefined}
    </main>
  </>
);

import type { FC } from "hono/jsx";
import type { NotesTable } from "#src/database/types/mod.ts";

type NotesIndexPageProps = {
  notes: Omit<NotesTable, "content">[];
  trash: boolean;
};

const ArticleItem: FC<
  { note: NotesIndexPageProps["notes"][0]; trash: boolean }
> = (
  { note, trash },
) => (
  <article>
    <h2>{note.name}</h2>

    <div style="display: flex" class="note-actions">
      <a class="button" href={`/notes/${note.id}`} style="margin-right: 8px">
        Show
      </a>

      {trash
        ? (
          <>
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

            <form
              method="post"
              action={`/notes/${note.id}/edit`}
              style="display: inline"
            >
              <input type="hidden" name="delete" value="false" />
              <button>Restore</button>
            </form>
          </>
        )
        : (
          <form
            method="post"
            action={`/notes/${note.id}/edit`}
            style="display: inline"
          >
            <input type="hidden" name="delete" value="true" />
            <button>Trash</button>
          </form>
        )}
    </div>
  </article>
);

export const NotesIndexPage: FC<NotesIndexPageProps> = ({ notes, trash }) => (
  <>
    <header>
      <nav>
        <a href="/" class={!trash ? "current" : ""}>Home</a>
        <a href="/trash" class={trash ? "current" : ""}>Trash 🗑</a>
      </nav>

      <h1>{trash ? `Noted's Trash` : `Noted`}</h1>
    </header>

    <header
      id="header-actions"
      style="position: sticky; top: 0; z-index: 2; padding: 0px;"
    >
      {trash
        ? (
          <>
            <dialog id={`dialog-empty`}>
              <p>
                Are you sure you want to delete <strong>ALL TRASHED</strong>
                {" "}
                notes?
              </p>

              <form
                style="display: inline; margin-right: 8px"
                action={`/trash/delete`}
                method="post"
              >
                <button type="submit">
                  Yes
                </button>
              </form>

              <form
                method="dialog"
                style="display: inline"
              >
                <button>No</button>
              </form>
            </dialog>

            <a
              class="button"
              style="margin-right: 8px"
              onclick={`getElementById("dialog-empty").show()`}
            >
              Delete all ⨯?
            </a>
          </>
        )
        : (
          <>
            <a href="/notes/create" class="button" style="margin-right: 8px">
              Add note +
            </a>

            <a
              href="/notes/export"
              class="button"
              style="margin-right: 8px"
              target="_blank"
            >
              Export ↧
            </a>
          </>
        )}
    </header>

    <main>
      {notes.map((note) => <ArticleItem note={note} trash={trash} />)}
      {notes.length <= 0 ? <p>No notes</p> : undefined}
    </main>
  </>
);

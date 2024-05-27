import type { FC } from "@hono/hono/jsx";
import type { NotesTable } from "#src/database/types/mod.ts";

type NotesEditPageProps = {
  note: NotesTable;
};

export const NotesEditPage: FC<NotesEditPageProps> = ({ note }) => (
  <>
    <header>
      <nav>
        <a href="/">Home</a>
        <a href="/trash">Trash 🗑</a>
      </nav>

      <h1>Edit {note.name}</h1>
    </header>

    <main>
      <article>
        <form action={`/notes/${note.id}/edit`} method="post">
          <div>
            <label for="name" style="position: block">Name</label>
            <input
              type="text"
              id="name"
              placeholder="Note name"
              name="name"
              value={note.name}
            />
          </div>

          <div>
            <label for="content">Content</label>
            <textarea
              id="content"
              name="content"
              placeholder="Write something"
              rows={5}
              style="overflow-y: hidden"
              oninput="this.style.height = this.scrollHeight + 'px'"
            >
              {note.content}
            </textarea>
          </div>

          <input type="submit" value="Edit" />
        </form>
      </article>
    </main>
    <script
      type="module"
      dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener("DOMContentLoaded", () => {
            const ele = document.getElementById("content");
            const data = ele.value;

            ele.style.height = ele.scrollHeight + 'px';
            ele.parentNode.dataset.replicatedValue = ele.value;
          })
        `,
      }}
    />
  </>
);

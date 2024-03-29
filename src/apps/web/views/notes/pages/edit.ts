import { html } from "hono/html";
import { layouts } from "#src/apps/web/views/common/mod.ts";
import { NotesTable } from "#src/database/types/mod.ts";

type NotesEditPageProps = {
  note: NotesTable;
};

const NotesEditPage = ({ note }: NotesEditPageProps) =>
  html`
  <header>
    <nav>
      <a href="/">Home</a>
    </nav>

    <h1>Edit ${note.name}</h1>
  </header>

  <main>
    <article>
      <form action="/notes/${note.id}/edit" method="POST">
        <div>
          <label for="name">Name</label>
          <input type="text" id="name" placeholder="Note name" name="name" value="${note.name}" />
        </div>

        <div>
          <label for="content">Content</label>
          <div class="grow-wrapper">
            <textarea
              id="content"
              name="content"
              placeholder="Write something"
              rows="5"
              oninput="this.parentNode.dataset.replicatedValue = this.value"
            >${note.content}</textarea>
          </div>
        </div>

        <input type="submit" value="Edit">
      </form>
    </article>
  </main>
`;

export default layouts.MainLayout({
  Csss: [
    () =>
      html`
      <style>

        label {
          display: block;
        }

        .grow-wrapper {
          display: grid;
        }

        .grow-wrapper::after {
          content: attr(data-replicated-value) " ";
          white-space: pre-wrap;
          visibility: hidden;
        }

        .grow-wrapper > textarea {
          resize: none;
          overflow: hidden;
        }
        .grow-wrapper > textarea,
        .grow-wrapper::after {
          border: 1px solid black;
          padding: 0.5rem;
          font: inherit;
          grid-area: 1 / 1 / 2 / 2;
        }
      </style>
    `,
  ],
  Body: NotesEditPage,
  Scripts: [
    () =>
      html`
      <script type="module">
        document.addEventListener("DOMContentLoaded", () => {
          const ele = document.getElementById("content");
          const data = ele.value;

          ele.parentNode.dataset.replicatedValue = ele.value;
        })
      </script>
    `,
  ],
});

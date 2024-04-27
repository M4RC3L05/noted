import { html } from "hono/html";
import { layouts } from "#src/apps/web/views/common/mod.ts";
import type { NotesTable } from "#src/database/types/mod.ts";

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
      <form action="/notes/${note.id}/edit" method="post">
        <div>
          <label for="name">Name</label>
          <input type="text" id="name" placeholder="Note name" name="name" value="${note.name}" />
        </div>

        <div>
          <label for="content">Content</label>
          <textarea
            id="content"
            name="content"
            placeholder="Write something"
            rows="5"
            style="overflow-y: hidden"
            oninput="this.style.height = this.scrollHeight + 'px'"
          >${note.content}</textarea>
          <style onload="getElementById('content').style.height = getElementById('content').scrollHeight + 'px'"></style>
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

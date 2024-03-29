import { html } from "hono/html";
import { layouts } from "../../common/mod.ts";
import { NotesTable } from "../../../../../database/types/mod.ts";

type NotesIndexPageProps = {
  notes: Omit<NotesTable, "content">[];
};

const NotesIndexPage = ({ notes }: NotesIndexPageProps) =>
  html`
  <header>
    <h1>Noted</h1>
  </header>

  <header id="header-actions" style="position: sticky; top: 0; z-index: 2; padding: 0px;">
    <a href="/notes/create" class="button">Add note +</a>
  </header>

  <main>
    ${
    notes.map((note) =>
      html`
        <article>
          <h2>${note.name}</h2>

          <div style="display: flex" class="note-actions">
            <a class="button" href="/notes/${note.id}" style="margin-right: 8px">Show</a>
            <form method="POST" action="/notes/${note.id}/delete">
              <input type="submit" value="Delete ⨯">
            </form>
          </div>
        </article>
      `
    )
  }
  ${notes.length <= 0 ? html`<p>No notes</p>` : html``}
  </main>
`;

export default layouts.MainLayout({
  Csss: [
    () =>
      html`
      <style>
        #header-actions .button,
        .note-actions .button,
        .note-actions button,
        .note-actions input[type="submit"] {
          font-size: .8rem;
          font-weight: bold;
          padding: .5rem .7rem;
          margin-top: .7rem;
          margin-bottom: .7rem;
        }
      </style>
    `,
  ],
  Body: NotesIndexPage,
});

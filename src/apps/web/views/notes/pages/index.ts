import { html } from "hono/helper.ts";
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

          <a href="/notes/${note.id}">Show</a>
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
        .feed-actions .button,
        .feed-actions button {
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

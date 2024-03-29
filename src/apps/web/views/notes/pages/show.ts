import { html, raw } from "hono/helper.ts";
import { layouts } from "../../common/mod.ts";
import { NotesTable } from "../../../../../database/types/mod.ts";

type NotesShowPageProps = {
  note: NotesTable;
  rendered: string;
};

const NotesShowPage = ({ note, rendered }: NotesShowPageProps) =>
  html`
  <header>
    <nav>
      <a href="/">Home</a>
    </nav>

    <h1>${note.name}</h1>
  </header>

  <header id="header-actions" style="position: sticky; top: 0; z-index: 2; padding: 0px;">
    <a href="/notes/${note.id}/edit" class="button">Edit note ✏</a>
  </header>

  <main>
    <article>
    ${raw(rendered)}
    </article>
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
  Body: NotesShowPage,
});

import { html } from "hono/helper.ts";
import { layouts } from "../../common/mod.ts";

const NotesCreatePage = () =>
  html`
  <header>
    <nav>
      <a href="/">Home</a>
    </nav>

    <h1>Create note</h1>
  </header>

  <main>
    <form action="/notes/create" method="POST">
      <div>
        <label for="name">Name</label>
        <input type="text" placeholder="Note name" name="name" />
      </div>

      <input type="submit" value="Create">
    </form>
  </main>
`;

export default layouts.MainLayout({ Body: NotesCreatePage });

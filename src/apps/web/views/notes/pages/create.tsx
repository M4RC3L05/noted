import type { FC } from "hono/jsx";

export const NotesCreatePage: FC = () => (
  <>
    <header>
      <nav>
        <a href="/">Home</a>
      </nav>

      <h1>Create note</h1>
    </header>

    <main>
      <form action="/notes/create" method="post">
        <div>
          <label for="name">Name</label>
          <input type="text" placeholder="Note name" name="name" />
        </div>

        <input type="submit" value="Create" />
      </form>
    </main>
  </>
);

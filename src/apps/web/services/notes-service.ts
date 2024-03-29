import { NotesTable } from "../../../database/types/mod.ts";
import { BaseService } from "./base-service.ts";

export class NotesService extends BaseService {
  getNotes(
    { signal }: { signal: AbortSignal },
  ): Promise<{ data: Omit<NotesTable, "content">[] }> {
    return this.request({ path: "/api/notes", init: { signal } });
  }

  getNote({ id, signal }: { id: string; signal: AbortSignal }) {
    return this.request({ path: `/api/notes/${id}`, init: { signal } });
  }

  createNote(
    { data, signal }: { data: Record<string, unknown>; signal: AbortSignal },
  ) {
    return this.request({
      path: "/api/notes",
      init: {
        body: JSON.stringify(data),
        method: "POST",
        signal,
        headers: { "content-type": "application/json" },
      },
    });
  }

  editNote(
    { data, id, signal }: {
      data: Record<string, unknown>;
      id: string;
      signal: AbortSignal;
    },
  ) {
    return this.request({
      path: `/api/notes/${id}`,
      init: {
        method: "PATCH",
        body: JSON.stringify(data),
        signal,
        headers: { "content-type": "application/json" },
      },
    });
  }

  deleteNote({ id, signal }: { id: string; signal: AbortSignal }) {
    return this.request({
      path: `/api/notes/${id}`,
      init: { signal, method: "DELETE" },
    });
  }
}

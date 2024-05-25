import type { NotesTable } from "#src/database/types/mod.ts";
import { BaseService } from "#src/apps/web/services/base-service.ts";

export class NotesService extends BaseService {
  getNotes(
    { trashed, signal }: {
      signal: AbortSignal;
      trashed?: boolean;
    },
  ): Promise<{ data: Omit<NotesTable, "content">[] }> {
    const searchParams = new URLSearchParams();
    if (trashed) searchParams.set("trashed", "true");

    return this.request({
      path: `/api/notes${
        searchParams.size > 0 ? `?${searchParams.toString()}` : ``
      }`,
      init: { signal },
    });
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

  deleteTrashed({ signal }: { signal: AbortSignal }) {
    return this.request({
      path: `/api/notes/trashed`,
      init: { signal, method: "DELETE" },
    });
  }
}

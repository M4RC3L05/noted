import { Database, Statement } from "@db/sqlite";
import { mapKeys } from "@std/collections";
import { toCamelCase as camelCase } from "@std/text";
import type { TSqlFragment } from "@m4rc3l05/sqlite-tag";
import config from "config";

const toCamelCase = <T>(data: unknown) => {
  if (Array.isArray(data)) {
    return data.map((item) => mapKeys(item, (key) => camelCase(key))) as T;
  }

  if (typeof data === "object") {
    return mapKeys(
      data as Record<string, unknown>,
      (key) => camelCase(key),
    ) as T;
  }

  return data as T;
};

// deno-lint-ignore no-explicit-any
class CustomStmt<T = any> extends Statement {
  override *[Symbol.iterator](): IterableIterator<T> {
    for (const item of super[Symbol.iterator]()) {
      yield toCamelCase(item);
    }
  }
}

export class CustomDatabase extends Database {
  #cache = new Map<string, CustomStmt>();

  // deno-lint-ignore no-explicit-any
  #ensureInCache<T = any>(query: string) {
    const key = query.trim();

    if (!this.#cache.has(key)) {
      this.#cache.set(key, this.prepare(key));
    }

    return this.#cache.get(key) as CustomStmt<T>;
  }

  override prepare(sql: string): CustomStmt {
    return new CustomStmt(this, sql);
  }

  get<T>(query: TSqlFragment): T | undefined {
    const prepared = this.#ensureInCache(query.query);

    // deno-lint-ignore no-explicit-any
    return toCamelCase<T>(prepared.get(...query.params as any));
  }

  all<T>(query: TSqlFragment): T[] {
    const prepared = this.#ensureInCache(query.query);

    // deno-lint-ignore no-explicit-any
    return toCamelCase<T[]>(prepared.all(...query.params as any));
  }

  execute(query: TSqlFragment) {
    const prepared = this.#ensureInCache(query.query);

    // deno-lint-ignore no-explicit-any
    return prepared.run(...query.params as any);
  }

  // deno-lint-ignore no-explicit-any
  getPrepared<T = any>(query: TSqlFragment) {
    return this.#ensureInCache<T>(query.query);
  }
}

export const makeDatabase = () => {
  const db = new CustomDatabase(config.get("database.path"));

  db.exec("pragma journal_mode = WAL");
  db.exec("pragma busy_timeout = 5000");
  db.exec("pragma foreign_keys = ON");
  db.exec("pragma synchronous = NORMAL");
  db.exec("pragma temp_store = MEMORY");
  // 4096 page_size * 10000 pages (cache_size) ≃ 40MB
  db.exec("pragma cache_size = 10000");
  db.function("uuid_v4", () => crypto.randomUUID());

  return db;
};

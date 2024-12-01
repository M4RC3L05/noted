import type { CustomDatabase } from "#src/database/mod.ts";

export const runMigrations = async (db: CustomDatabase) => {
  const migrationsPathRelative = "../../database/migrations";
  const migartionsDir = new URL(migrationsPathRelative, import.meta.url);
  let [{ foreign_keys: foreingKeysVal }] = db.sql`pragma foreign_keys`;
  foreingKeysVal = foreingKeysVal === 1 ? "ON" : "OFF";

  db.exec("pragma foreign_keys = off");

  for await (const file of Deno.readDir(migartionsDir)) {
    if (!file.name.endsWith(".sql")) continue;

    const filePath = new URL(
      `${migrationsPathRelative}/${file.name}`,
      import.meta.url,
    );

    db.exec(await Deno.readTextFile(filePath));
  }

  db.exec(`pragma foreign_keys = ${foreingKeysVal}`);
};

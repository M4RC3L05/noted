import { ProcessLifecycle } from "#src/common/process/process-lifecycle.ts";
import { makeLogger } from "#src/common/logger/mod.ts";
import { gracefulShutdown } from "#src/common/process/mod.ts";
import { type CustomDatabase, makeDatabase } from "#src/database/mod.ts";
import { makeApp } from "#src/apps/api/app.ts";
import config from "config";

const log = makeLogger("api");
const { host, port } = config.get("apps.api");
const processLifecycle = new ProcessLifecycle();

gracefulShutdown({ processLifecycle, log });

processLifecycle.on("bootStarted", () => {
  log.info("Process boot started");
});

processLifecycle.on("bootEnded", ({ error }) => {
  if (error) {
    log.error("Process boot ended with error", { error });
  } else {
    log.info("Process boot ended");
  }
});

processLifecycle.on("shutdownStarted", () => {
  log.info("Process shutdown started");
});

processLifecycle.on("shutdownEnded", ({ error }) => {
  if (error) {
    log.error("Process shutdown ended with error", { error });
  } else {
    log.info("Process shutdown ended");
  }
});

processLifecycle.on("bootServiceStarted", ({ name }) => {
  log.info(`Service "${name}" boot started`);
});

processLifecycle.on("bootServiceEnded", ({ name, error }) => {
  if (error) {
    log.error(`Service "${name}" boot ended with error`, { error });
  } else {
    log.info(`Service "${name}" boot ended`);
  }
});

processLifecycle.on("shutdownServiceStarted", ({ name }) => {
  log.info(`Service "${name}" shutdown started`);
});

processLifecycle.on("shutdownServiceEnded", ({ name, error }) => {
  if (error) {
    log.error(`Service "${name}" shutdown ended with errors`, { error });
  } else {
    log.info(`Service "${name}" shutdown ended`);
  }
});

processLifecycle.registerService({
  name: "db",
  boot: () => makeDatabase(),
  shutdown: (db) => db.close(),
});

processLifecycle.registerService({
  name: "api",
  boot: (pl) => {
    const app = makeApp({
      db: pl.getResult<CustomDatabase>("db"),
      signal: pl.signal,
    });

    const server = Deno.serve({
      hostname: host,
      port,
      onListen: ({ hostname, port }) => {
        log.info(`Serving on http://${hostname}:${port}`);
      },
    }, app.fetch);

    return server;
  },
  shutdown: (server) => server.shutdown(),
});

await processLifecycle.boot();

import { ProcessLifecycle } from "../../common/process/process-lifecycle.ts";
import { makeLogger } from "#src/common/logger/mod.ts";
import { gracefulShutdown } from "#src/common/process/mod.ts";
import { makeApp } from "#src/apps/web/app.ts";
import config from "config";

const log = makeLogger("web");
const { host, port } = config.get("apps.web");
const processLifecycle = new ProcessLifecycle({
  log,
  onFinishShutdown: (error) => {
    log.info("Exiting application");

    if (error.error) {
      if (error.reason === "timeout") {
        log.warn("Global shutdown timeout exceeded");
      }

      Deno.exit(1);
    } else {
      Deno.exit(0);
    }
  },
});

gracefulShutdown({ processLifecycle, log });

processLifecycle.registerService({
  name: "api",
  boot: (pl) => {
    const app = makeApp({ signal: pl.signal });

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

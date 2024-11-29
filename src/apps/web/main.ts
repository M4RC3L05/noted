import { makeLogger } from "#src/common/logger/mod.ts";
import { gracefulShutdown } from "#src/common/process/mod.ts";
import { makeApp } from "#src/apps/web/app.tsx";
import config from "config";
import { ProcessLifecycle } from "@m4rc3l05/process-lifecycle";
import { NotesService } from "#src/apps/web/services/mod.ts";

const log = makeLogger("web");
const { host, port } = config.get("apps.web");
const processLifecycle = new ProcessLifecycle();

gracefulShutdown({ processLifecycle, log });

processLifecycle.registerService({
  name: "web",
  boot: (pl) => {
    const servicesConfig = config.get("apps.web.services");

    const services = {
      notesService: new NotesService(
        servicesConfig.api.url,
        servicesConfig.api.basicAuth,
      ),
    };

    const app = makeApp({ shutdown: pl.signal, services });

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

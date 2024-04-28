import type { Logger } from "@std/log";
import type { ProcessLifecycle } from "./process-lifecycle.ts";

export const gracefulShutdown = (
  { processLifecycle, log }: {
    processLifecycle: ProcessLifecycle;
    log: Logger;
  },
) => {
  for (const signal of ["SIGABRT", "SIGTERM", "SIGINT"] as Deno.Signal[]) {
    Deno.addSignalListener(signal, () => {
      log.info(`OS Signal "${signal}" captured`);

      processLifecycle.shutdown();
    });
  }

  globalThis.addEventListener("unhandledrejection", (e) => {
    log.error("Unhandled rejection captured", { reason: e.reason });

    e.preventDefault();

    processLifecycle.shutdown();
  });

  globalThis.addEventListener("error", (e) => {
    log.error("Unhandled error captured", { error: e.error });

    e.preventDefault();

    processLifecycle.shutdown();
  });
};

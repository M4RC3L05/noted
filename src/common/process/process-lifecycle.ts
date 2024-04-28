import { delay } from "@std/async";

type ProcessLifecycleOptions = {
  shutdownTimeout?: number;
  bootTimeout?: number;
};

// deno-lint-ignore no-explicit-any
export type ServiceRegistration<BR = any> = {
  name: string;
  boot:
    | ((hd: ProcessLifecycle) => Promise<BR>)
    | ((hd: ProcessLifecycle) => BR);
  shutdown: ((data: BR) => Promise<void>) | ((data: BR) => void);
  timeout?: number;
};

const warpInPromise = (
  // deno-lint-ignore no-explicit-any
  fn: ((...args: any[]) => Promise<void>) | ((...args: any[]) => void),
) => {
  // deno-lint-ignore no-explicit-any
  return (...args: any[]) =>
    new Promise((resolve, reject) => {
      try {
        const result = fn(...args);

        if (result instanceof Promise) {
          result.then(resolve).catch(reject);
        } else {
          resolve(result);
        }
      } catch (error) {
        reject(error);
      }
    });
};

class GlobalTimeoutExceededError extends Error {}

type ProcessLifecycleEvents = {
  bootStarted: () => void;
  bootEnded: (result: { error?: any }) => void;
  shutdownStarted: () => void;
  shutdownEnded: (result: { error?: any }) => void;
  bootServiceStarted: (service: Pick<ServiceRegistration, "name">) => void;
  bootServiceEnded: (
    service: Pick<ServiceRegistration, "name"> & { error?: any },
  ) => void;
  shutdownServiceStarted: (service: Pick<ServiceRegistration, "name">) => void;
  shutdownServiceEnded: (
    service: Pick<ServiceRegistration, "name"> & { error?: any },
  ) => void;
};

type ProcessLifecycleEventsKeys = keyof ProcessLifecycleEvents;

export class ProcessLifecycle {
  #abortController = new AbortController();
  #hooksStaged: Required<ServiceRegistration>[] = [];
  #hooks: Required<ServiceRegistration>[] = [];
  #results = new Map<string, unknown>();
  #options: Required<ProcessLifecycleOptions>;
  #booted = false;
  #eventsHandlers = new Map<
    ProcessLifecycleEventsKeys,
    ProcessLifecycleEvents[ProcessLifecycleEventsKeys]
  >();

  constructor(options?: ProcessLifecycleOptions) {
    this.#options = {
      bootTimeout: 15_000,
      shutdownTimeout: 15_000,
      ...(options ?? {}),
    };
  }

  get signal() {
    return this.#abortController.signal;
  }

  get booted() {
    return this.#booted;
  }

  on<KE extends ProcessLifecycleEventsKeys>(
    event: KE,
    fn: ProcessLifecycleEvents[KE],
  ) {
    this.#eventsHandlers.set(event, fn);
  }

  // deno-lint-ignore no-explicit-any
  getResult<R = any>(name: string) {
    return this.#results.get(name) as R;
  }

  // deno-lint-ignore no-explicit-any
  registerService<BR = any>(hook: ServiceRegistration<BR>) {
    if (this.#abortController.signal.aborted) return;

    this.#hooksStaged.push({
      ...hook,
      boot: warpInPromise(hook.boot),
      shutdown: warpInPromise(hook.shutdown),
      timeout: hook.timeout ?? 5_000,
    });
  }

  boot = (() => {
    let bootJob: Promise<void>;
    let running = false;

    return () => {
      if (running) {
        return bootJob;
      }

      running = true;

      if (!bootJob) {
        bootJob = this.#executeLifecycle("boot");
      }

      return bootJob;
    };
  })();

  shutdown = (() => {
    let shutdownJob: Promise<void>;
    let running = false;

    return () => {
      if (running) {
        return shutdownJob;
      }

      running = true;

      if (!shutdownJob) {
        shutdownJob = this.#executeLifecycle("shutdown");

        this.#abortController.abort();
      }

      return shutdownJob;
    };
  })();

  #getHandler<KE extends ProcessLifecycleEventsKeys>(
    event: KE,
  ) {
    return this.#eventsHandlers.get(event) as
      | ProcessLifecycleEvents[KE]
      | undefined;
  }

  async #executeLifecycle(mode: "boot" | "shutdown"): Promise<void> {
    const hooks = mode === "shutdown"
      ? this.#hooks.toReversed()
      : this.#hooksStaged;
    const globalDelay = mode === "shutdown"
      ? this.#options.shutdownTimeout
      : this.#options.bootTimeout;
    const globalTimeout = delay(globalDelay, { persistent: false })
      .then(() => "global-timeout");

    try {
      // this.#options.log.info(`Executing ${mode} hooks`);
      this.#getHandler(`${mode}Started`)?.();

      for (const hook of hooks) {
        // this.#options.log.info(`Executing ${mode} hook "${hook.name}"`);
        this.#getHandler(`${mode}ServiceStarted`)?.({ name: hook.name });

        try {
          const response = await Promise.race([
            mode === "shutdown"
              ? hook.shutdown(this.#results.get(hook.name))
              : hook.boot(this),
            delay(hook.timeout, { persistent: false }).then(() => "timeout"),
            globalTimeout,
          ]);

          if (response === "timeout") {
            throw new Error("Hook timeout exceeded");
          }

          if (response === "global-timeout") {
            throw new GlobalTimeoutExceededError("Global timeout exceeded");
          }

          if (mode === "shutdown") {
            this.#results.delete(hook.name);
          } else {
            this.#hooks.push(hook);
            this.#results.set(hook.name, response);
          }

          // this.#options.log.info(`Done executing ${mode} hook "${hook.name}"`);
          this.#getHandler(`${mode}ServiceEnded`)?.({ name: hook.name });
        } catch (error) {
          // this.#options.log.info(`Done executing ${mode} hook "${hook.name}"`);
          this.#getHandler(`${mode}ServiceEnded`)?.({ name: hook.name, error });

          if (mode === "boot" || error instanceof GlobalTimeoutExceededError) {
            throw error;
          }
        }
      }

      // this.#options.log.info(`Done executing ${mode} hooks`);
      this.#getHandler(`${mode}Ended`)?.({});

      if (mode === "boot") {
        this.#booted = true;
      }
    } catch (error) {
      if (mode === "boot") {
        this.#getHandler(`${mode}Ended`)?.({ error });
        // this.#options.log.info("Proceed to shutdown");
        return this.#executeLifecycle("shutdown");
      }

      if (mode === "shutdown") {
        // this.#options.onFinishShutdown?.({ error: false, reason: error });
        this.#getHandler(`${mode}Ended`)?.({ error });

        return;
      }
    }
  }
}

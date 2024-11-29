import { encodeBase64 } from "@std/encoding/base64";

export abstract class BaseService {
  #baseUrl: string;
  #auth: { username: string; password: string };

  constructor(baseUrl: string, auth: { username: string; password: string }) {
    this.#baseUrl = baseUrl;
    this.#auth = auth;
  }

  request(
    { path, init, sendResponse }: {
      path: string;
      init?: Parameters<typeof fetch>[1];
      sendResponse?: boolean;
    },
  ) {
    if (init) {
      init.headers = new Headers(init.headers);
      (init.headers as Headers).set(
        "authorization",
        `Basic ${
          encodeBase64(`${this.#auth.username}:${this.#auth.password}`)
        }`,
      );

      init.signal = init?.signal
        ? AbortSignal.any([init.signal, AbortSignal.timeout(10_000)])
        : AbortSignal.timeout(10_000);
    }

    return fetch(`${this.#baseUrl}${path}`, init).then((response) => {
      if (sendResponse) return response;
      if (response.status === 204) return;

      if (!response.headers.get("content-type")?.includes("application/json")) {
        if (!response.ok) {
          throw new Error("Request not ok", { cause: response });
        }

        return;
      }

      return response.json();
    }).then((data) => {
      if (sendResponse) return data;
      if (!data) return;

      if (data.error) throw new Error("Bad request", { cause: data.error });

      return data;
    }).catch((error) => {
      throw new Error("Request error", { cause: error });
    });
  }
}

import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { makeLogger } from "../logger/mod.ts";
import { toSnakeCase } from "@std/text";

type ErrorMapperDeps = {
  isJsonResponse?: boolean;
  mappers?: Array<(error: unknown) => HTTPException | undefined>;
  defaultMapper: (error: unknown) => HTTPException;
};

const log = makeLogger("error-mapper-middleware");

const respond = (error: HTTPException, c: Context) => {
  const payload = {
    error: {
      code: toSnakeCase(error.name),
      message: error.message.length > 0
        ? error.message
        : "Something went wrong",
    },
  };

  return c.json(payload, {
    status: error.status,
    headers: error.getResponse().headers,
  });
};

const errorMapper = (deps: ErrorMapperDeps) => {
  return (error: unknown, c: Context) => {
    log.error("Caught request error", { error });

    if (error instanceof HTTPException) {
      return respond(error, c);
    }

    let mapped: HTTPException | undefined;

    for (const mapper of (deps.mappers ?? [])) {
      mapped = mapper(error);

      if (mapped) break;
    }

    if (!mapped) {
      mapped = deps.defaultMapper(error);
    }

    return respond(mapped, c);
  };
};

export default errorMapper;

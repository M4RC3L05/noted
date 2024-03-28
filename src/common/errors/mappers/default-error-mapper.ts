import { HTTPException } from "hono";

const defaultErrorMapper = (error: unknown) => {
  return Object.assign(
    new HTTPException(500, { message: "Something went wrong" }),
    { cause: error },
  );
};

export default defaultErrorMapper;

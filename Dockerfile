FROM docker.io/denoland/deno:alpine-1.41.3

EXPOSE 4321
WORKDIR /app

RUN mkdir data
RUN chown -R deno:deno ./data

USER deno

COPY . .

RUN deno task deps

CMD ["run", "-A", "--unstable-ffi", "--lock=deno.lock", "--cached-only", "src/apps/api/main.ts"]

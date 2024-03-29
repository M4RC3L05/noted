import { html } from "hono/html";
import { HtmlEscapedString } from "hono/utils/html";

// deno-lint-ignore no-explicit-any
type Component<P extends Record<string, unknown> = any> = P extends Record<
  string,
  unknown
> ? (props: P) => HtmlEscapedString | Promise<HtmlEscapedString>
  : () => HtmlEscapedString | Promise<HtmlEscapedString>;

// deno-lint-ignore no-explicit-any
type ScriptComponent<P extends Record<string, unknown> = any> = Component<P>;
// deno-lint-ignore no-explicit-any
type BodyComponent<P extends Record<string, unknown> = any> = Component<P>;
// deno-lint-ignore no-explicit-any
type CSSComponent<P extends Record<string, unknown> = any> = Component<P>;

const MainLayout = <B extends BodyComponent>({
  Body,
  Scripts,
  Csss,
}: {
  Body?: B;
  Scripts?: ScriptComponent<Parameters<B>[0]>[];
  Csss?: CSSComponent<Parameters<B>[0]>[];
}): Component<
  Parameters<B>[0]
> =>
  ((props) =>
    html`
      <!doctype html>
      <html lang="en">

      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>NOTED</title>
        <link rel="stylesheet" href="https://esm.sh/v135/simpledotcss@2.3.0/simple.min.css" />

        ${Csss?.map((Css) => Css(props))}
      </head>

      <body>
        ${Body?.(props)}

        ${Scripts?.map((Script) => Script(props))}
      </body>

      </html>
    `) as Component<Parameters<B>[0]>;

export default MainLayout;

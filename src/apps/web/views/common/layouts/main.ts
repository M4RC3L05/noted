import { html } from "hono/helper.ts";
import type { HtmlEscapedString } from "hono/utils/html.ts";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type Component<P extends Record<string, unknown> = any> = P extends Record<
  string,
  unknown
> ? (props: P) => HtmlEscapedString | Promise<HtmlEscapedString>
  : () => HtmlEscapedString | Promise<HtmlEscapedString>;

type ScriptComponent<P extends Record<string, unknown> = any> = Component<P>;
type BodyComponent<P extends Record<string, unknown> = any> = Component<P>;
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

        <script type="importmap">
          {
            "imports": {
              "marked": "https://esm.sh/v135/marked@12.0.1"
            }
          }
        </script>
        <script type="module">
          const replaceAndReload = (url) => {
            history.replaceState(null, null, url);
            location.reload();
          }

          window.replaceAndReload = replaceAndReload;
        </script>
        ${Scripts?.map((Script) => Script(props))}
      </body>

      </html>
    `) as Component<Parameters<B>[0]>;

export default MainLayout;

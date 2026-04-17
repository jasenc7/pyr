import { type HandlerFn } from "fresh";
import SCRIPT from "../assets/install.sh";

export const handler: HandlerFn<unknown, unknown> = (ctx) => {
  console.log(
    JSON.stringify({
      event: "install.sh",
      ua: ctx.req.headers.get("user-agent"),
      country:
        ctx.req.headers.get("cf-ipcountry") ??
        ctx.req.headers.get("x-deno-region"),
      ts: Date.now(),
    }),
  );
  return new Response(SCRIPT, {
    headers: { "content-type": "application/x-sh" },
  });
};

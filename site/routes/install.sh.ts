import { type HandlerFn } from "fresh";
import SCRIPT from "../assets/install.sh";

export const handler: HandlerFn<unknown, unknown> = (ctx) => {
  const h = ctx.req.headers;
  console.log(
    JSON.stringify({
      event: "install.sh",
      ua: h.get("user-agent"),
      country: h.get("cf-ipcountry"),
      city: h.get("cf-ipcity"),
      region: h.get("cf-region"),
      edge: Deno.env.get("DENO_REGION"),
      ts: Date.now(),
    }),
  );
  return new Response(SCRIPT, {
    headers: { "content-type": "application/x-sh" },
  });
};

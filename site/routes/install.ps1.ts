import { type HandlerFn } from "fresh";
import SCRIPT from "../assets/install.ps1";

export const handler: HandlerFn<unknown, unknown> = (ctx) => {
  const h = ctx.req.headers;
  console.log(
    JSON.stringify({
      event: "install.ps1",
      country: h.get("cf-ipcountry"),
    }),
  );
  return new Response(SCRIPT, {
    headers: { "content-type": "application/x-powershell" },
  });
};

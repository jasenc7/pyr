import { type HandlerFn } from "fresh";
import SCRIPT from "../assets/install.ps1";

export const handler: HandlerFn<unknown, unknown> = (ctx) => {
  console.log(
    JSON.stringify({
      event: "install.ps1",
      country: ctx.req.headers.get("cf-ipcountry"),
    }),
  );
  return new Response(SCRIPT, {
    headers: { "content-type": "application/x-powershell" },
  });
};

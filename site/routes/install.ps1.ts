import { type HandlerFn } from "fresh";
import SCRIPT from "../assets/install.ps1";

export const handler: HandlerFn<unknown, unknown> = () => {
  console.log(JSON.stringify({ event: "install.ps1" }));
  return new Response(SCRIPT, {
    headers: { "content-type": "application/x-powershell" },
  });
};

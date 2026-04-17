import { type HandlerFn } from "fresh";
import SCRIPT from "../assets/install.sh";

export const handler: HandlerFn<unknown, unknown> = () => {
  console.log(JSON.stringify({ event: "install.sh" }));
  return new Response(SCRIPT, {
    headers: { "content-type": "application/x-sh" },
  });
};

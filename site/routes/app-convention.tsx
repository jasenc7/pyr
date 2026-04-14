import { Head } from "fresh/runtime";
import { CSS, render } from "$gfm";
import DocLayout from "../components/DocLayout.tsx";

const md = await Deno.readTextFile(
  new URL("../app-convention.md", import.meta.url),
);
const html = render(md, { baseUrl: "https://pyrun.dev" });

export default function AppConvention() {
  return (
    <>
      <Head>
        <style>{CSS}</style>
      </Head>
      <DocLayout html={html} href="/app-convention" />
    </>
  );
}

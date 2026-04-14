import { Head } from "fresh/runtime";
import { CSS, render } from "$gfm";
import DocLayout from "../components/DocLayout.tsx";

const md = await Deno.readTextFile(
  new URL("../docs.md", import.meta.url),
);
const html = render(md, { baseUrl: "https://pyrun.dev" });

export default function Docs() {
  return (
    <>
      <Head>
        <style>{CSS}</style>
      </Head>
      <DocLayout html={html} href="/docs" />
    </>
  );
}

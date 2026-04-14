import { Head } from "fresh/runtime";
import { CSS, render } from "$gfm";
import DocLayout from "../components/DocLayout.tsx";
import md from "../docs.md";

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

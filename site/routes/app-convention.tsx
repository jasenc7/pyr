import { Head } from "fresh/runtime";
import { CSS, render } from "$gfm";
import DocLayout from "../components/DocLayout.tsx";
import md from "../app-convention.md";

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

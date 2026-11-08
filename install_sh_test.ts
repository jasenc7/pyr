import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { fileURLToPath } from "node:url";

async function installerFixture(validChecksum: boolean) {
  const root = await Deno.makeTempDir({ prefix: "pyr-installer-test-" });
  const commands = `${root}/commands`;
  const fixtures = `${root}/fixtures`;
  const home = `${root}/home`;
  const tmp = `${root}/tmp`;
  const calls = `${root}/calls`;
  const unpacked = `${root}/unpacked`;
  const installed = `${home}/bin/pyr`;
  try {
    for (const dir of [commands, fixtures, `${home}/bin`, tmp]) {
      await Deno.mkdir(dir, { recursive: true });
    }

    const archive = new TextEncoder().encode("test archive");
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", archive)))
      .map((byte) => byte.toString(16).padStart(2, "0")).join("");
    await Deno.writeFile(`${fixtures}/pyr-linux-x86_64.zip`, archive);
    await Deno.writeTextFile(
      `${fixtures}/SHA256SUMS`,
      `${validChecksum ? digest : "0".repeat(64)}  pyr-linux-x86_64.zip\n`,
    );
    if (!validChecksum) await Deno.writeTextFile(installed, "previous binary\n");

    const scripts: Record<string, string> = {
      uname: `#!/bin/sh
case "$1" in
  -s) echo Linux ;;
  -m) echo x86_64 ;;
  *) exit 1 ;;
esac
`,
      curl: `#!/bin/sh
set -eu
url=""
out=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    -o) out="$2"; shift 2 ;;
    https://*) url="$1"; shift ;;
    *) shift ;;
  esac
done
printf '%s\\n' "$url" >> "$PYR_TEST_CALLS"
case "$url" in
  https://api.github.com/repos/jasenc7/pyr/releases/latest)
    printf '{"tag_name":"v9.8.7"}\\n' ;;
  https://github.com/jasenc7/pyr/releases/download/v9.8.7/SHA256SUMS)
    cp "$PYR_TEST_FIXTURES/SHA256SUMS" "$out" ;;
  https://github.com/jasenc7/pyr/releases/download/v9.8.7/pyr-linux-x86_64.zip)
    cp "$PYR_TEST_FIXTURES/pyr-linux-x86_64.zip" "$out" ;;
  *) echo "unexpected URL: $url" >&2; exit 1 ;;
esac
`,
      unzip: `#!/bin/sh
set -eu
[ "$1" = "-qo" ] && [ "$3" = "-d" ]
printf '#!/bin/sh\\necho fixture\\n' > "$4/pyr"
printf 'unpacked\\n' > "$PYR_TEST_UNPACKED"
`,
    };
    for (const [name, script] of Object.entries(scripts)) {
      await Deno.writeTextFile(`${commands}/${name}`, script);
      await Deno.chmod(`${commands}/${name}`, 0o755);
    }

    const result = await new Deno.Command("/bin/sh", {
      args: [fileURLToPath(new URL("./site/assets/install.sh", import.meta.url))],
      env: {
        HOME: root,
        PATH: `${commands}:${Deno.env.get("PATH") ?? ""}`,
        PYR_HOME: home,
        PYR_TEST_CALLS: calls,
        PYR_TEST_FIXTURES: fixtures,
        PYR_TEST_UNPACKED: unpacked,
        TMPDIR: tmp,
      },
      stdout: "piped",
      stderr: "piped",
    }).output();
    const readOptional = async (path: string) => {
      try {
        return await Deno.readTextFile(path);
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) return null;
        throw error;
      }
    };
    return {
      code: result.code,
      output: new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr),
      requests: (await Deno.readTextFile(calls)).trim().split("\n"),
      installed: await readOptional(installed),
      unpacked: await readOptional(unpacked),
    };
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

Deno.test({
  name: "POSIX installer fetches and installs the canonical release",
  ignore: Deno.build.os === "windows",
  fn: async () => {
    const result = await installerFixture(true);
    assertEquals(result.code, 0, result.output);
    assertEquals(result.requests, [
      "https://api.github.com/repos/jasenc7/pyr/releases/latest",
      "https://github.com/jasenc7/pyr/releases/download/v9.8.7/SHA256SUMS",
      "https://github.com/jasenc7/pyr/releases/download/v9.8.7/pyr-linux-x86_64.zip",
    ]);
    assertEquals(result.installed, "#!/bin/sh\necho fixture\n");
    assertEquals(result.unpacked, "unpacked\n");
  },
});

Deno.test({
  name: "POSIX installer preserves an existing binary on checksum mismatch",
  ignore: Deno.build.os === "windows",
  fn: async () => {
    const result = await installerFixture(false);
    assertEquals(result.code, 1, result.output);
    assertStringIncludes(result.output, "SHA-256 mismatch");
    assertEquals(result.installed, "previous binary\n");
    assertEquals(result.unpacked, null);
  },
});

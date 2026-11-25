import { assert, assertMatch } from "https://deno.land/std@0.224.0/assert/mod.ts";

const incorrectOwnerRepository = "axiomlayer/pyr";

Deno.test("Windows installer requires an x64 host and selects the x64 release asset", async () => {
  const script = await Deno.readTextFile(
    new URL("./site/assets/install.ps1", import.meta.url),
  );
  assertMatch(script, /\$Repo = "jasenc7\/pyr"/);
  assert(
    !script.includes(incorrectOwnerRepository),
    "installer must not target the private placeholder",
  );
  assertMatch(script, /\$Release\.assets/);
  assertMatch(script, /\$nativeArch -ne "AMD64"/);
  assertMatch(script, /pyr-windows-x86_64\.zip/);
  assertMatch(script, /SHA256SUMS/);
  assertMatch(script, /does not contain pyr\.exe at its archive root/);

  const tls = script.indexOf("[Net.ServicePointManager]::SecurityProtocol");
  const firstGithubRequest = script.indexOf("Invoke-RestMethod");
  assert(tls >= 0, "installer must configure TLS");
  assert(firstGithubRequest >= 0, "installer must fetch release metadata");
  assert(tls < firstGithubRequest, "installer must configure TLS before contacting GitHub");
});

Deno.test("POSIX installer is HTTPS-only and redirects Windows compatibility shells", async () => {
  const script = await Deno.readTextFile(
    new URL("./site/assets/install.sh", import.meta.url),
  );
  assertMatch(script, /REPO="jasenc7\/pyr"/);
  assert(
    !script.includes(incorrectOwnerRepository),
    "installer must not target the private placeholder",
  );
  assertMatch(script, /mingw\*\|msys\*\|cygwin\*/);
  assertMatch(script, /run install\.ps1 from PowerShell/);
  assertMatch(script, /curl --proto '=https' --tlsv1\.2 -fsSL/);

  const platformCheck = script.indexOf('case "$os" in');
  const prerequisiteCheck = script.indexOf("command -v unzip");
  assert(platformCheck >= 0, "installer must classify the host OS");
  assert(prerequisiteCheck >= 0, "installer must check unzip");
  assert(
    platformCheck < prerequisiteCheck,
    "Git Bash must receive Windows guidance before POSIX prerequisite checks",
  );
});

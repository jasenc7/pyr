import CopyButton from "../islands/CopyButton.tsx";
import Terminal from "../islands/Terminal.tsx";

const INSTALL_CMD = "curl -fsSL https://pyrun.dev/install.sh | sh";

const FEATURES = [
  {
    title: "Zero system deps",
    body:
      "pyr bootstraps its own CPython runtime. No brew, no apt, no pyenv. curl and you're running.",
  },
  {
    title: "Six commands",
    body:
      "init, run, add, remove, sync, upgrade. That's the whole API. No activate, no pip freeze, no requirements hell.",
  },
  {
    title: "Honest lockfile",
    body:
      "pyproject.toml is the source of truth. requirements.txt is a generated, fully-pinned lock. Edit either; pyr reconciles on the next run.",
  },
  {
    title: "Self-updating",
    body:
      "pyr upgrade updates the tool. pyr upgrade --python updates the runtime. Stale venvs rebuild automatically.",
  },
  {
    title: "Not written in Python",
    body:
      "The thing that manages Python shouldn't need Python to install. pyr is a single compiled binary that drives pip and the runtime it bootstraps — never the other way around.",
  },
];

export default function Home() {
  return (
    <>
      {/* nav */}
      <nav class="nav">
        <span class="nav-logo">pyrun</span>
        <a
          class="nav-link"
          href="https://github.com/jasenc7/pyr"
          target="_blank"
          rel="noopener"
        >
          github
        </a>
      </nav>

      {/* hero */}
      <section class="hero">
        <h1>
          Python without
          <br />
          the ceremony
        </h1>
        <p>
          A project manager that bootstraps its own runtime, manages your venv,
          and gets out of the way. Six commands. One honest lockfile.
        </p>
        <div class="install">
          <span>
            <span class="prompt">$</span>
            {INSTALL_CMD}
          </span>
          <CopyButton text={INSTALL_CMD} />
        </div>
      </section>

      {/* terminal demo */}
      <section class="terminal-wrap">
        <Terminal />
      </section>

      <div class="divider" />

      {/* features */}
      <section class="features">
        <div class="features-grid">
          {FEATURES.map((f, i) => (
            <div class="feature" style={{ animationDelay: `${i * 0.1}s` }}>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div class="divider" />

      {/* philosophy */}
      <section class="philosophy">
        <p class="philosophy-label">the philosophy</p>
        <blockquote>
          The thing that manages Python shouldn't be Python.
        </blockquote>
        <p>
          uv is Rust. poetry is Python — and bootstrapping it is the problem it
          claims to solve. pyr is a single compiled binary. It drives pip and
          the standalone CPython runtime; it doesn't depend on them to install
          itself.
        </p>
      </section>

      {/* footer */}
      <footer class="footer">
        <span>pyrun.dev</span>
        <span>by jasencarroll</span>
      </footer>
    </>
  );
}

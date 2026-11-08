import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";

const STEPS = [
  {
    cmd: "curl -fsSL https://pyrun.dev/install.sh | sh",
    output: "installed to ~/.pyr/bin/pyr",
  },
  {
    cmd: "pyr init myproject && cd myproject",
    output:
      "bootstrapping python...\ndownloading cpython 3.14.4...\nmyproject ready",
  },
  {
    cmd: "pyr add httpx",
    output: "resolving dependencies...\n+5  -0  (0 unchanged)",
  },
  {
    cmd: "pyr remove httpx",
    output: "pruning 5 orphan(s)...\n+0  -5  (0 unchanged)",
  },
  {
    cmd: "pyr run",
    output: "hello world",
  },
];

export default function Terminal() {
  const step = useSignal(0);
  const charIndex = useSignal(0);
  const phase = useSignal<"typing" | "output" | "pause">("pause");
  const visibleOutputs = useSignal<number[]>([]);

  useEffect(() => {
    // initial pause before first command
    const timer = setTimeout(() => {
      phase.value = "typing";
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (phase.value === "typing") {
      const currentCmd = STEPS[step.value]?.cmd;
      if (!currentCmd) return;

      if (charIndex.value >= currentCmd.length) {
        // done typing, show output
        const timer = setTimeout(() => {
          phase.value = "output";
          visibleOutputs.value = [...visibleOutputs.value, step.value];
        }, 600);
        return () => clearTimeout(timer);
      }

      const timer = setTimeout(() => {
        charIndex.value++;
      }, 25);
      return () => clearTimeout(timer);
    }

    if (phase.value === "output") {
      if (step.value < STEPS.length - 1) {
        const timer = setTimeout(() => {
          step.value++;
          charIndex.value = 0;
          phase.value = "typing";
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [phase.value, charIndex.value, step.value]);

  return (
    <div class="terminal">
      <div class="terminal-dots">
        <div class="terminal-dot" />
        <div class="terminal-dot" />
        <div class="terminal-dot" />
      </div>

      {STEPS.map((s, i) => {
        if (i > step.value) return null;

        const isCurrentStep = i === step.value;
        const cmdText = isCurrentStep ? s.cmd.slice(0, charIndex.value) : s.cmd;
        const showCursor = isCurrentStep && phase.value === "typing";
        const showOutput = visibleOutputs.value.includes(i);

        return (
          <div key={i}>
            <div>
              <span class="prompt">$</span>
              <span class="cmd">{cmdText}</span>
              {showCursor && <span class="cursor">_</span>}
            </div>
            {showOutput && <div class="output">{s.output}</div>}
          </div>
        );
      })}
    </div>
  );
}

import { useSignal } from "@preact/signals";

export default function CopyButton({ text }: { text: string }) {
  const copied = useSignal(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      copied.value = true;
      setTimeout(() => (copied.value = false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <button type="button" class="copy-btn" onClick={copy}>
      {copied.value ? "copied" : "copy"}
    </button>
  );
}

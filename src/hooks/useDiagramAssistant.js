import { useRef, useState } from "react";
import { describeToDiagram } from "../utils/importers/describe-to-diagram.js";
export function useDiagramAssistant() {
  const engine = useRef(null),
    [progress, setProgress] = useState(""),
    [busy, setBusy] = useState(false);
  const generate = async (prompt, type, mode) => {
    if (!prompt.trim())
      throw new Error("Describe the diagram you want to create.");
    setBusy(true);
    try {
      if (mode === "instant") {
        const result = describeToDiagram(prompt, type);
        return typeof result === "string" ? result : result.code;
      }
      if (!navigator.gpu)
        throw new Error(
          "The local model needs WebGPU. Use Instant mode or a browser with WebGPU enabled.",
        );
      if (!engine.current) {
        setProgress(
          "Downloading the local model. This can take several minutes.",
        );
        const { CreateMLCEngine } = await import("@mlc-ai/web-llm");
        engine.current = await CreateMLCEngine(
          "Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC",
          { initProgressCallback: (p) => setProgress(p.text) },
        );
      }
      setProgress("Generating on your device…");
      const result = await engine.current.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `Return only valid Mermaid diagram source. Use ${type === "auto" ? "the most appropriate diagram type" : type}. No explanation.`,
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 2048,
      });
      const answer = result.choices[0]?.message.content || "";
      return (
        answer.match(/```(?:mermaid)?\s*\n([\s\S]*?)```/)?.[1]?.trim() ||
        answer.trim()
      );
    } finally {
      setBusy(false);
      setProgress("");
    }
  };
  return { generate, progress, busy };
}

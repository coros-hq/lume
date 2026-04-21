import { Message } from "../types";

interface StreamOptions {
  model: string;
  messages: Message[];
  onChunk: (token: string) => void;
  onDone: () => void;
  onError: (err: Error) => void;
}

export function streamFromOllama({
  model,
  messages,
  onChunk,
  onDone,
  onError,
}: StreamOptions): AbortController {
  const controller = new AbortController();

  fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: controller.signal,
    body: JSON.stringify({
      model,
      stream: true,
      messages,
    }),
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`Ollama error: ${res.status}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value, { stream: true }).split("\n");

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            const token = json?.message?.content;
            if (token) onChunk(token);
            if (json.done) {
              onDone();
              return;
            }
          } catch {
            // incomplete line — skip
          }
        }
      }
      onDone();
    })
    .catch((err) => {
      if (err.name !== "AbortError") onError(err);
    });

  return controller;
}

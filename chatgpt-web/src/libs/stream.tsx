import { Message } from "@/api/types";

interface SSEEvent {
  type: "delta" | "done" | "error";
  data: string;
}

export class SSEStreamParser {
  private remainder = "";

  parse(chunk: string): SSEEvent[] {
    this.remainder += chunk;
    const messageBlocks = this.remainder.split("\n\n");
    this.remainder = messageBlocks.pop() || "";

    return messageBlocks
      .filter((block) => block.trim())
      .map((block) => this.parseBlock(block))
      .filter((event): event is SSEEvent => event !== null);
  }

  private parseBlock(block: string): SSEEvent | null {
    let event = "";
    let data = "";

    const lines = block.split("\n");
    for (const line of lines) {
      if (line.startsWith("event: ")) {
        event = line.substring(7).trim();
      } else if (line.startsWith("data: ")) {
        data = line.substring(6);
      }
    }

    if (!event) return null;

    return {
      type: event as SSEEvent["type"],
      data,
    };
  }
}

export async function streamResponse(
  body: ReadableStream<Uint8Array>,
  assistantMessageId: number,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const streamParser = new SSEStreamParser();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const events = streamParser.parse(chunk);

    for (const event of events) {
      switch (event.type) {
        case "delta":
          try {
            const text = JSON.parse(event.data);
            if (typeof text === "string") {
              setMessages((prev) => prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, content: msg.content + text } : msg)));
            }
          } catch (e) {
            console.error("Error parsing SSE JSON data:", event.data, e);
          }
          break;

        case "done":
          return;

        case "error":
          console.error("Server-sent error event:", event.data);
          throw new Error("Streaming error");
      }
    }
  }
}

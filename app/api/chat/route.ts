import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are Geyvak Assistant, a friendly, level-headed shopping companion. Help users compare products, find best value, and make confident decisions. Be concise (2-4 short paragraphs max), warm but practical. When comparing, lead with the trade-off. When the user is stuck, ask one focused question. Never recommend a specific brand without acknowledging trade-offs.`;

type IncomingMessage = {
  role: "user" | "assistant";
  content: string;
};

function jsonError(error: string, status: number) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function toGeminiContents(messages: IncomingMessage[]) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return jsonError("GEMINI_API_KEY is not set on the server.", 500);
  }

  let body: { messages?: IncomingMessage[] };

  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const messages = body.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonError("messages must be a non-empty array.", 400);
  }

  const safeMessages = messages
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
    )
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, 8000),
    }));

  if (safeMessages.length === 0) {
    return jsonError("No valid messages found.", 400);
  }

  const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const geminiStream = await client.models.generateContentStream({
          model: "gemini-2.5-flash",
          contents: toGeminiContents(safeMessages),
          config: {
            systemInstruction: SYSTEM_PROMPT,
            maxOutputTokens: 1024,
          },
        });

        for await (const chunk of geminiStream) {
          const text = chunk.text;
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }

        controller.close();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown upstream error.";

        console.error("[/api/chat] stream error:", message);

        try {
          controller.enqueue(
            encoder.encode("\n\n[Error: stream interrupted]")
          );
        } catch {}

        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}

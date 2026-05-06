import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are Geyvak, a shopping companion who serves the person you're talking to. Geyvak means "sevak" — one who serves — and the people you serve are anyone trying to make a careful buying decision.

You serve them, not the market. You don't push, upsell, or hurry. You answer what they ask, but you answer well — with the patience of someone who genuinely wants the right thing for them, even if that's nothing at all.

If asked who you are or what your name means, you may explain: Geyvak is from "sevak," servant. You may use a Sanskrit or Hindi word when the user invites it or it fits naturally — never to decorate or to seem profound.

You don't lecture. You don't moralize about what people buy. If someone asks for help choosing between two of something they've already decided to buy, help them choose. Your service is in the care of your answer, not the policing of their decision.

When you compare, lead with the trade-off. When someone is stuck, ask one focused question rather than five. When you don't know, say so plainly. Never invent specs, prices, or product details.

Be concise — usually 2–4 short paragraphs. Warm, but not chatty. Plain language, not jargon. The tone of a friend who has thought about this longer than you have, sharing what they noticed.

Never recommend a single brand without naming what it gives up. There is always a trade-off. Naming it is part of serving honestly.`;
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

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonError("ANTHROPIC_API_KEY is not set on the server.", 500);
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
    .map((m) => ({ role: m.role, content: m.content.slice(0, 8000) }));

  if (safeMessages.length === 0) {
    return jsonError("No valid messages found.", 400);
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream({
          model: "claude-sonnet-4-5",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: safeMessages,
        });

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
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

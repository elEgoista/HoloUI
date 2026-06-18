import { requireLocalAuth } from "@/lib/hologram/auth";
import { encodeSse, runnerEvents } from "@/lib/hologram/events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const authError = requireLocalAuth(request);
  if (authError) return authError;

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let keepAlive: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(": connected\n\n"));

      unsubscribe = runnerEvents.subscribe((event) => {
        controller.enqueue(encoder.encode(encodeSse(event)));
      });

      keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, 15000);
    },
    cancel() {
      if (keepAlive) {
        clearInterval(keepAlive);
      }
      unsubscribe?.();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}

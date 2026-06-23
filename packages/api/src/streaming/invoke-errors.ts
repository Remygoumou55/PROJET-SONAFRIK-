import { STREAMING_ERROR_MESSAGES } from "@sonafrik/types";

export type StreamingErrorCode = keyof typeof STREAMING_ERROR_MESSAGES;

type InvokeOperation = "start" | "progress" | "complete";

const KNOWN_CODES = new Set<string>(Object.keys(STREAMING_ERROR_MESSAGES));

type FunctionInvokeError = Error & { context?: unknown };

const DEFAULT_BY_OPERATION: Record<InvokeOperation, StreamingErrorCode> = {
  start: "stream_start_failed",
  progress: "stream_progress_failed",
  complete: "stream_complete_failed",
};

/** Extrait le code métier renvoyé par une Edge Function streaming. */
export function mapFunctionInvokeError(
  operation: InvokeOperation,
  error: FunctionInvokeError | null,
): StreamingErrorCode {
  if (!error) return "unknown";

  const message = error.message.toLowerCase();
  if (message.includes("unauthorized") || message.includes("jwt")) {
    return "unauthorized";
  }
  if (message.includes("aborted") || message.includes("abort")) {
    return "stream_progress_failed";
  }

  const bodyCode = extractErrorCodeFromContext(error);
  if (bodyCode && KNOWN_CODES.has(bodyCode)) {
    return bodyCode as StreamingErrorCode;
  }

  if (message.includes("session")) return "session_not_found";

  return DEFAULT_BY_OPERATION[operation];
}

function extractErrorCodeFromContext(error: FunctionInvokeError): string | null {
  const ctx = error.context;
  if (!ctx) return null;

  try {
    if (ctx instanceof Response) {
      return null;
    }
    if (typeof ctx === "object" && ctx !== null && "body" in ctx) {
      const body = (ctx as { body?: unknown }).body;
      if (typeof body === "string") {
        const parsed = JSON.parse(body) as { error?: string };
        return parsed.error ?? null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

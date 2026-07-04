type FunctionInvokeError = Error & { context?: unknown };
type InvokeErrorBody = { error?: string; message?: string };

function parseInvokeErrorBody(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as InvokeErrorBody;
    return parsed.error ?? parsed.message ?? null;
  } catch {
    return trimmed;
  }
}

export function extractFunctionInvokeMessage(
  error: FunctionInvokeError | null,
  fallback = "Edge Function returned a non-2xx status code",
): string {
  if (!error) return fallback;
  const ctx = error.context;
  if (ctx instanceof Response) return error.message || fallback;
  if (typeof ctx === "object" && ctx !== null && "body" in ctx) {
    const body = (ctx as { body?: unknown }).body;
    if (typeof body === "string") {
      return parseInvokeErrorBody(body) ?? error.message ?? fallback;
    }
  }
  return error.message || fallback;
}

export async function extractFunctionInvokeMessageAsync(
  error: FunctionInvokeError | null,
  fallback = "Edge Function returned a non-2xx status code",
): Promise<string> {
  if (!error) return fallback;
  const ctx = error.context;
  if (ctx instanceof Response) {
    try {
      const body = (await ctx.clone().json()) as InvokeErrorBody;
      return body.error ?? body.message ?? error.message ?? fallback;
    } catch {
      try {
        const text = await ctx.clone().text();
        return parseInvokeErrorBody(text) ?? error.message ?? fallback;
      } catch {
        return error.message || fallback;
      }
    }
  }
  return extractFunctionInvokeMessage(error, fallback);
}

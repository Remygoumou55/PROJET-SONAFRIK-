import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
const CORS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_PAYMENT_METHODS = ["orange_money", "mtn_momo", "wave", "card", "internal"] as const;
type PaymentMethod = (typeof VALID_PAYMENT_METHODS)[number];

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Client authentifié — la RPC topup_wallet tourne en SECURITY DEFINER
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: "unauthorized" }, 401);

    const body = await req.json() as {
      amountGnf: unknown;
      paymentMethod: unknown;
      paymentReference: unknown;
      description?: unknown;
    };

    const amountGnf = Number(body.amountGnf);
    const paymentMethod = body.paymentMethod as PaymentMethod;
    const paymentReference = typeof body.paymentReference === "string" ? body.paymentReference : null;

    // Validation côté Edge Function (double protection avant la RPC)
    if (!amountGnf || amountGnf < 1000) {
      return json({ error: "minimum_topup_1000_gnf" }, 400);
    }

    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return json({ error: "invalid_payment_method" }, 400);
    }

    // Délégation à la RPC atomique — atomicité + idempotence garanties par PostgreSQL
    const { data, error: rpcError } = await userClient.rpc("topup_wallet" as never, {
      p_amount_gnf: amountGnf,
      p_payment_method: paymentMethod,
      p_payment_reference: paymentReference,
      p_description: typeof body.description === "string" ? body.description : null,
    } as never);

    if (rpcError) {
      const msg = rpcError.message;
      if (msg.includes("minimum_topup")) return json({ error: "minimum_topup_1000_gnf" }, 400);
      if (msg.includes("wallet_not_found")) return json({ error: "wallet_not_found" }, 404);
      if (msg.includes("invalid_payment_method")) return json({ error: "invalid_payment_method" }, 400);
      return json({ error: "topup_failed" }, 500);
    }

    const result = data as {
      success: boolean;
      transaction_id: string;
      new_balance_gnf: number;
      idempotent: boolean;
    };

    return json({
      success: true,
      transaction_id: result.transaction_id,
      new_balance_gnf: result.new_balance_gnf,
      idempotent: result.idempotent,
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "internal_error" }, 500);
  }
});

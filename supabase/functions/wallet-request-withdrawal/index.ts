import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { payoutAccountId, amountGnf } = body as {
      payoutAccountId: string;
      amountGnf: number;
    };

    if (!payoutAccountId || !amountGnf || amountGnf < 5000) {
      return new Response(JSON.stringify({ error: "minimum_withdrawal_5000_gnf" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Appel RPC request_withdrawal via client authentifié
    const { data: withdrawalId, error: rpcError } = await anonClient.rpc("request_withdrawal", {
      p_payout_account_id: payoutAccountId,
      p_amount_gnf: amountGnf,
    });

    if (rpcError) {
      const errMsg = rpcError.message;
      let clientError = "withdrawal_failed";
      if (errMsg.includes("insufficient_balance")) clientError = "insufficient_balance";
      if (errMsg.includes("minimum_withdrawal")) clientError = "minimum_withdrawal_5000_gnf";
      if (errMsg.includes("payout_account_not_found")) clientError = "payout_account_not_found";

      return new Response(JSON.stringify({ error: clientError }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, withdrawal_id: withdrawalId }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "internal_error" }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});

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

    // Client authentifié pour récupérer l'utilisateur
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
    const { amountGnf, paymentMethod, paymentReference } = body as {
      amountGnf: number;
      paymentMethod: string;
      paymentReference: string;
    };

    if (!amountGnf || amountGnf < 1000) {
      return new Response(JSON.stringify({ error: "minimum_topup_1000_gnf" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Service role pour accès complet
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Récupérer le wallet
    const { data: wallet, error: walletError } = await adminClient
      .from("wallets")
      .select("id, balance_gnf")
      .eq("user_id", user.id)
      .single();

    if (walletError || !wallet) {
      return new Response(JSON.stringify({ error: "wallet_not_found" }), {
        status: 404,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const newBalance = Number(wallet.balance_gnf) + amountGnf;

    // Transaction
    const { data: transaction, error: txError } = await adminClient
      .from("transactions")
      .insert({
        user_id: user.id,
        wallet_id: wallet.id,
        type: "topup",
        status: "completed",
        amount_gnf: amountGnf,
        commission_gnf: 0,
        net_amount_gnf: amountGnf,
        currency: "GNF",
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        description: `Recharge portefeuille — ${paymentMethod}`,
        processed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (txError) throw new Error("transaction_insert_failed");

    // Mise à jour du solde
    await adminClient
      .from("wallets")
      .update({
        balance_gnf: newBalance,
        total_credited_gnf: adminClient.rpc as never,
      })
      .eq("user_id", user.id);

    // Mise à jour manuelle (rpc non disponible dans edge function sans type)
    await adminClient.from("wallets").update({
      balance_gnf: newBalance,
    }).eq("user_id", user.id);

    // Entrée ledger
    await adminClient.from("wallet_ledger").insert({
      wallet_id: wallet.id,
      user_id: user.id,
      entry_type: "credit",
      amount_gnf: amountGnf,
      balance_after_gnf: newBalance,
      reason: "topup",
      reference_id: transaction!.id,
      reference_type: "transactions",
      metadata: { payment_method: paymentMethod, payment_reference: paymentReference },
    });

    return new Response(
      JSON.stringify({ success: true, new_balance_gnf: newBalance, transaction_id: transaction!.id }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "internal_error" }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});

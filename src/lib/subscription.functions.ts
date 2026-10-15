import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const SUBSCRIPTION_PRICE = 41.4;
const BASE = "https://mycash.cc/api/v1/pix";

function key() {
  const k = process.env["MYCASH_API_KEY"];
  if (!k) throw new Error("Pagamento Pix não configurado.");
  return k;
}
async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

export const createSubscriptionPix = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const res = await fetch(`${BASE}/generate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ amount: SUBSCRIPTION_PRICE }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.pix_code) {
      if (body.code === "RATE_LIMITED") return { error: "Muitas tentativas. Aguarde alguns segundos." };
      return { error: body.error ?? "Não foi possível gerar o Pix." };
    }
    const reference = String(body.reference);
    const db = await admin();
    await db.from("subscriptions").insert({ reference, user_id: context.userId, amount: SUBSCRIPTION_PRICE });
    return { pixCode: String(body.pix_code), reference };
  });

export const checkSubscriptionPix = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ reference: z.string().regex(/^[A-Za-z0-9_-]{1,80}$/) }).parse(d))
  .handler(async ({ data, context }) => {
    const res = await fetch(`${BASE}/status/${data.reference}`, { headers: { Authorization: `Bearer ${key()}` } });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { paid: false };
    if (String(body.status) === "completed") {
      const db = await admin();
      await db.from("subscriptions").update({ paid: true, paid_at: new Date().toISOString() })
        .eq("reference", data.reference).eq("user_id", context.userId).eq("paid", false);
      return { paid: true };
    }
    return { paid: false };
  });

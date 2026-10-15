import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { skins } from "./skins";

const BASE = "https://mycash.cc/api/v1/pix";
const SELL_FEE = 0.08;

function key() {
  const k = process.env["MYCASH_API_KEY"];
  if (!k) throw new Error("Pagamento Pix não configurado.");
  return k;
}

function priced(ids: string[]) {
  return ids.map((id) => {
    const s = skins.find((x) => x.id === id);
    if (!s) throw new Error("Item inválido no carrinho.");
    return s;
  });
}

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

async function recordPurchases(userId: string, ids: string[], method: "pix" | "card", reference: string | null) {
  const db = await admin();
  const rows = priced(ids).map((s) => ({ user_id: userId, skin_id: s.id, name: s.name, price: s.price, method, reference }));
  const { error } = await db.from("purchases").insert(rows);
  if (error) throw new Error("Não foi possível registrar a compra.");
}

const Ids = z.object({ ids: z.array(z.string().max(20)).min(1).max(100) });

export const createPix = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Ids.parse(d))
  .handler(async ({ data, context }) => {
    // Price is computed on the server from the catalog, never trusted from the browser.
    const amount = Math.round(priced(data.ids).reduce((a, s) => a + s.price, 0) * 100) / 100;
    const res = await fetch(`${BASE}/generate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.pix_code) {
      console.error("mycash generate failed", res.status, body);
      if (body.code === "AMOUNT_BELOW_MIN" || body.code === "AMOUNT_ABOVE_MAX")
        return { error: `Pix aceita valores entre R$ ${body.min ?? 10} e R$ ${body.max ?? 500}.` };
      if (body.code === "RATE_LIMITED") return { error: "Muitas tentativas. Aguarde alguns segundos." };
      return { error: body.error ?? "Não foi possível gerar o Pix." };
    }
    const reference = String(body.reference);
    const db = await admin();
    await db.from("pix_payments").insert({ reference, user_id: context.userId, skin_ids: data.ids, amount });
    return { pixCode: String(body.pix_code), reference, amount };
  });

export const checkPix = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ reference: z.string().regex(/^[A-Za-z0-9_-]{1,80}$/) }).parse(d))
  .handler(async ({ data, context }) => {
    const res = await fetch(`${BASE}/status/${data.reference}`, { headers: { Authorization: `Bearer ${key()}` } });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { status: "pending", isFinal: false };
    const status = String(body.status);
    if (status === "completed") {
      const db = await admin();
      // Claim once: only the owner, only an unclaimed payment.
      const { data: claimed } = await db
        .from("pix_payments")
        .update({ claimed: true })
        .eq("reference", data.reference)
        .eq("user_id", context.userId)
        .eq("claimed", false)
        .select("skin_ids")
        .maybeSingle();
      if (claimed) await recordPurchases(context.userId, claimed.skin_ids, "pix", data.reference);
    }
    return { status, isFinal: Boolean(body.is_final) };
  });

// Card is a simulation for now: no real charge happens.
export const payCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Ids.parse(d))
  .handler(async ({ data, context }) => {
    await recordPurchases(context.userId, data.ids, "card", null);
    return { ok: true };
  });

const Uid = z.object({ id: z.string().uuid() });

export const sellPurchase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Uid.parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin();
    const { data: row } = await db.from("purchases").select("price").eq("id", data.id).eq("user_id", context.userId).eq("state", "owned").maybeSingle();
    if (!row) throw new Error("Item indisponível.");
    const value = Math.round(Number(row.price) * (1 - SELL_FEE) * 100) / 100;
    await db.from("purchases").update({ state: "sold", sale_value: value, updated_at: new Date().toISOString() }).eq("id", data.id).eq("state", "owned");
    return { value };
  });

export const transferPurchase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Uid.parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin();
    const { data: row } = await db.from("purchases").update({ state: "transferred", updated_at: new Date().toISOString() })
      .eq("id", data.id).eq("user_id", context.userId).eq("state", "owned").select("id").maybeSingle();
    if (!row) throw new Error("Item indisponível.");
    return { ok: true };
  });

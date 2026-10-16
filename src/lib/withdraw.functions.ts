import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Req = z.object({ pixKey: z.string().trim().min(3).max(100), pixType: z.enum(["CPF", "Telefone", "E-mail", "Aleatória"]) });

export const requestWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Req.parse(d))
  .handler(async ({ data, context }) => {
    // Amount comes from the user's sold items in the database, never from the browser.
    const { data: sold } = await context.supabase.from("purchases").select("sale_value").eq("user_id", context.userId).eq("state", "sold");
    const amount = (sold ?? []).reduce((a, r) => a + Number(r.sale_value ?? 0), 0);
    if (amount <= 0) throw new Error("Sem saldo para solicitar saque.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("withdrawal_requests").insert({
      user_id: context.userId, email: (context.claims as { email?: string }).email ?? null,
      pix_key: data.pixKey, pix_type: data.pixType, amount: Math.round(amount * 100) / 100,
    });
    if (error) throw new Error("Não foi possível registrar a solicitação.");
    return { ok: true };
  });

export const listWithdrawals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) return { admin: false, rows: [] };
    const { data } = await context.supabase.from("withdrawal_requests").select("*").order("created_at", { ascending: false });
    return { admin: true, rows: data ?? [] };
  });

export const setWithdrawalStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), status: z.enum(["approved", "rejected", "pending"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("withdrawal_requests").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error("Sem permissão.");
    return { ok: true };
  });

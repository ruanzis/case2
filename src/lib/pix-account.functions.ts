import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getPixAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("pix_accounts")
      .select("pix_key, pix_type")
      .eq("user_id", context.userId)
      .maybeSingle();
    return data ? { key: data.pix_key, type: data.pix_type } : null;
  });

export const savePixAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ pixKey: z.string().trim().min(3).max(100), pixType: z.string().min(1).max(20) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("pix_accounts")
      .upsert({ user_id: context.userId, pix_key: data.pixKey, pix_type: data.pixType });
    if (error) throw new Error("Não foi possível salvar a conta Pix.");
    return { ok: true };
  });

export const deletePixAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.from("pix_accounts").delete().eq("user_id", context.userId);
    if (error) throw new Error("Não foi possível remover a conta Pix.");
    return { ok: true };
  });

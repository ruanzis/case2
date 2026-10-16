import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const startSteamLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ origin: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: u } = await context.supabase.auth.getUser();
    if (!u.user?.email_confirmed_at) throw new Error("EMAIL_UNVERIFIED");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const nonce = crypto.randomUUID();
    const { error } = await supabaseAdmin.from("steam_link_states").insert({ nonce, user_id: context.userId });
    if (error) throw new Error("Não foi possível iniciar a conexão com a Steam.");
    const origin = new URL(data.origin).origin;
    const returnTo = `${origin}/api/public/steam/callback?state=${nonce}`;
    const p = new URLSearchParams({
      "openid.ns": "http://specs.openid.net/auth/2.0",
      "openid.mode": "checkid_setup",
      "openid.return_to": returnTo,
      "openid.realm": origin,
      "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
      "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
    });
    return { url: `https://steamcommunity.com/openid/login?${p}` };
  });

export const getSteamAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("steam_accounts").select("steam_id").eq("user_id", context.userId).maybeSingle();
    return data ? { steamId: data.steam_id } : null;
  });

export const disconnectSteam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase.from("steam_accounts").delete().eq("user_id", context.userId);
    return { ok: true };
  });

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/steam/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const back = (s: string) => Response.redirect(`${url.origin}/?steam=${s}`, 302);
        const state = url.searchParams.get("state");
        if (!state || url.searchParams.get("openid.mode") !== "id_res") return back("cancel");
        // Verify the assertion directly with Steam
        const body = new URLSearchParams();
        url.searchParams.forEach((v, k) => { if (k.startsWith("openid.")) body.set(k, v); });
        body.set("openid.mode", "check_authentication");
        let text = "";
        try {
        const res = await fetch("https://steamcommunity.com/openid/login", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });
        text = await res.text();
        } catch { return back("unreachable"); }
        if (!/is_valid\s*:\s*true/.test(text)) return back("invalid");
        const returnTo = url.searchParams.get("openid.return_to") ?? "";
        if (!returnTo.startsWith(`${url.origin}/api/public/steam/callback`)) return back("invalid");
        const m = (url.searchParams.get("openid.claimed_id") ?? "").match(/^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/);
        if (!m) return back("invalid");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: st } = await supabaseAdmin.from("steam_link_states").select("user_id, created_at").eq("nonce", state).maybeSingle();
        await supabaseAdmin.from("steam_link_states").delete().eq("nonce", state);
        if (!st || Date.now() - new Date(st.created_at).getTime() > 15 * 60 * 1000) return back("expired");
        const { error } = await supabaseAdmin.from("steam_accounts").upsert({ user_id: st.user_id, steam_id: m[1] as string });
        return back(error ? "server" : "ok");
      },
    },
  },
});

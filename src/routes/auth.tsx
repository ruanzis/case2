import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useCart } from "@/lib/cart";
import { skins } from "@/lib/skins";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — csgomoney.site" },
      { name: "description", content: "Crie sua conta no csgomoney.site para guardar suas compras e seu histórico." },
      { property: "og:title", content: "Entrar — csgomoney.site" },
      { property: "og:description", content: "Acesse sua conta no csgomoney.site." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const email = z.string().trim().email("E-mail inválido").max(255);
const strong = z
  .string()
  .min(8, "A senha precisa ter pelo menos 8 caracteres")
  .max(72)
  .regex(/[a-z]/, "Inclua uma letra minúscula")
  .regex(/[A-Z]/, "Inclua uma letra maiúscula")
  .regex(/\d/, "Inclua um número")
  .regex(/[^A-Za-z0-9]/, "Inclua um símbolo (ex: ! @ #)");

function AuthPage() {
  const { user } = useCart();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => { if (user) navigate({ to: "/venda-instantanea", replace: true }); }, [user, navigate]);

  const submit = async (e: React.FormEvent): Promise<unknown> => {
    e.preventDefault();
    const em = email.safeParse(form.email);
    if (!em.success) return toast.error(em.error.issues[0]!.message);
    if (mode === "up") {
      const pw = strong.safeParse(form.password);
      if (!pw.success) return toast.error(pw.error.issues[0]!.message);
      if (form.password !== form.confirm) return toast.error("As senhas não coincidem");
    } else if (!form.password) return toast.error("Digite sua senha");
    setLoading(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email: em.data, password: form.password, options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: em.data, password: form.password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
      }
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      toast.error(
        /invalid login/i.test(m) ? "E-mail ou senha incorretos." :
        /not confirmed/i.test(m) ? "Confirme seu e-mail antes de entrar." :
        /already registered/i.test(m) ? "Este e-mail já tem conta. Entre com sua senha." :
        /pwned|leaked|weak/i.test(m) ? "Essa senha é fraca ou já vazou. Escolha outra." :
        "Não foi possível continuar. Tente novamente.",
      );
    } finally { setLoading(false); }
    return undefined;
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Não foi possível entrar com o Google.");
  };

  const input = "w-full rounded-md border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary";

  return (
    <div className="relative overflow-hidden rounded-xl py-10">
      <SkinsBackdrop />
    <div className="relative mx-auto max-w-sm rounded-xl border bg-surface/90 p-6 shadow-2xl backdrop-blur-md">
      {sent ? (
        <div className="text-center">
          <h1 className="font-display text-xl font-bold">Confirme seu e-mail</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enviamos um link para {form.email}. Clique nele para ativar sua conta.</p>
        </div>
      ) : (
        <>
          <h1 className="mb-1 font-display text-2xl font-bold">{mode === "in" ? "Entrar" : "Criar conta"}</h1>
          <p className="mb-5 text-sm text-muted-foreground">Para acessar o site é preciso se registrar. Suas compras e histórico ficam salvos na conta.</p>
          <form onSubmit={submit} className="space-y-3">
            <input className={input} type="email" placeholder="E-mail" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className={input} type="password" placeholder="Senha" autoComplete={mode === "in" ? "current-password" : "new-password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {mode === "up" && (
              <>
                <input className={input} type="password" placeholder="Confirmar senha" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
                <p className="text-xs text-muted-foreground">Mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo.</p>
              </>
            )}
            <button disabled={loading} className="w-full rounded-md bg-primary py-2.5 font-medium text-primary-foreground disabled:opacity-50">
              {loading ? "Aguarde..." : mode === "in" ? "Entrar" : "Criar conta"}
            </button>
          </form>
          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />ou<div className="h-px flex-1 bg-border" /></div>
          <button type="button" onClick={google} className="flex w-full items-center justify-center gap-2 rounded-md border bg-card py-2.5 text-sm font-medium hover:bg-card-hover"><GoogleIcon />Continuar com o Google</button>
          <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground">
            {mode === "in" ? "Primeiro acesso? Criar conta" : "Já tem conta? Entrar"}
          </button>
        </>
      )}
    </div>
    </div>
  );
}

const imgs = Array.from(new Map(skins.map((s) => [s.image, s])).values());

function SkinsBackdrop() {
  const row = (rev: boolean) => (
    <div className={`flex w-max gap-6 ${rev ? "animate-marquee-rev" : "animate-marquee"}`}>
      {[...imgs, ...imgs].map((s, i) => (
        <div key={i} className="flex h-28 w-40 shrink-0 items-center justify-center rounded-lg bg-card/60 p-3">
          <img src={s.image} alt="" className="max-h-full max-w-full object-contain" />
        </div>
      ))}
    </div>
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-6 opacity-40">
      {row(false)}
      {row(true)}
      {row(false)}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";

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

  const submit = async (e: React.FormEvent) => {
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
  };

  const input = "w-full rounded-md border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary";

  return (
    <div className="mx-auto mt-8 max-w-sm rounded-xl bg-surface p-6">
      {sent ? (
        <div className="text-center">
          <h1 className="font-display text-xl font-bold">Confirme seu e-mail</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enviamos um link para {form.email}. Clique nele para ativar sua conta.</p>
        </div>
      ) : (
        <>
          <h1 className="mb-1 font-display text-2xl font-bold">{mode === "in" ? "Entrar" : "Criar conta"}</h1>
          <p className="mb-5 text-sm text-muted-foreground">Suas compras e seu histórico ficam salvos na sua conta.</p>
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
          <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground">
            {mode === "in" ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
          </button>
        </>
      )}
    </div>
  );
}

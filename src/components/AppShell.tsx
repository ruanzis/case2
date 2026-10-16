import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Crown, Zap, Users, Landmark, History, X, Trash2, LogOut } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Checkout } from "./Checkout";
import { SteamConnect } from "./SteamConnect";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { brl } from "@/lib/skins";

const tabs = [
  { to: "/", label: "Comprar", icon: ShoppingCart },
  { to: "/venda-instantanea", label: "Venda instantânea", icon: Zap },
  { to: "/p2p", label: "P2P Venda", icon: Users },
  { to: "/saque", label: "Saque", icon: Landmark },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/assinatura", label: "Premium", icon: Crown },
] as const;

function Logo({ size = "text-xl" }: { size?: string }) {
  return (
    <Link to="/" className={`font-display ${size} font-bold tracking-tight`}>
      case<span className="text-primary">2.com.br</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const cart = useCart();
  const [checkout, setCheckout] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const onAuth = pathname === "/inicio";
  useEffect(() => {
    if (cart.authReady && !cart.user && !onAuth) navigate({ to: "/auth", replace: true });
  }, [cart.authReady, cart.user, onAuth, navigate]);
  if (!onAuth && !cart.user) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando...</div>;
  }
  if (onAuth) {
    return <div className="min-h-screen p-4"><div className="mb-6 text-center"><Logo size="text-4xl sm:text-5xl" /></div>{children}</div>;
  }
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-6 border-b bg-background/95 px-4 backdrop-blur">
        <Logo />
        <nav className="hidden gap-5 text-sm text-muted-foreground md:flex">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-accent" }}>Market</Link>
          <Link to="/faq" activeProps={{ className: "text-accent" }}>FAQ</Link>
          <Link to="/assinatura" activeProps={{ className: "text-accent" }}>Premium</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <SteamConnect />
          <button
            onClick={() => cart.setOpen(true)}
            className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm"
          >
            {brl(cart.total)} <ShoppingCart className="h-4 w-4" />
            {cart.items.length > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{cart.items.length}</span>
            )}
          </button>
          {cart.user ? (
            <button
              onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/", replace: true }); }}
              className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
              title={cart.user.email ?? ""}
            >
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sair</span>
            </button>
          ) : (
            <Link to="/inicio" className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground">
              Entrar
            </Link>
          )}
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-24 shrink-0 flex-col items-center gap-2 border-r py-4 sm:flex">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: true }}
              className="flex w-20 flex-col items-center gap-1 rounded-md py-2 text-center text-[11px] leading-tight text-muted-foreground hover:text-foreground"
              activeProps={{ className: "text-foreground bg-secondary" }}
            >
              <t.icon className="h-5 w-5" />
              {t.label}
            </Link>
          ))}
        </aside>
        <main className="min-w-0 flex-1 p-4 pb-24 sm:pb-4">{children}</main>
      </div>

      {/* mobile tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t bg-surface py-2 sm:hidden">
        {tabs.map((t) => (
          <Link key={t.to} to={t.to} activeOptions={{ exact: true }} className="flex flex-col items-center text-[10px] text-muted-foreground" activeProps={{ className: "text-primary" }}>
            <t.icon className="h-5 w-5" />
            {t.label.split(" ")[0]}
          </Link>
        ))}
      </nav>

      {checkout && <Checkout onClose={() => setCheckout(false)} />}
      {cart.open && (
        <div className="fixed inset-0 z-40 flex justify-end bg-background/70" onClick={() => cart.setOpen(false)}>
          <div className="flex h-full w-full max-w-sm flex-col bg-surface p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Carrinho</h2>
              <button onClick={() => cart.setOpen(false)} aria-label="Fechar"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto">
              {cart.items.length === 0 && <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p>}
              {cart.items.map((i) => (
                <div key={i.id} className="flex items-center gap-3 rounded-md bg-card p-2">
                  <img src={i.image} alt={i.name} className="h-12 w-16 object-contain" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs">{i.name}</p>
                    <p className="text-sm font-semibold">{brl(i.price)}</p>
                  </div>
                  <button onClick={() => cart.toggle(i)} aria-label="Remover"><Trash2 className="h-4 w-4 text-muted-foreground" /></button>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t pt-4">
              <div className="mb-3 flex justify-between text-sm"><span>Total</span><span className="font-semibold">{brl(cart.total)}</span></div>
              <button
                disabled={!cart.items.length}
                onClick={() => {
                  cart.setOpen(false);
                  if (!cart.user) { toast.info("Entre na sua conta para finalizar a compra."); navigate({ to: "/inicio" }); return; }
                  setCheckout(true);
                }}
                className="w-full rounded-md bg-primary py-2.5 font-medium text-primary-foreground disabled:opacity-50"
              >
                Finalizar compra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

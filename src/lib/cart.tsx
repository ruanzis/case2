import { type Context, createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { skins, type Skin } from "./skins";

export const SELL_FEE = 0.08;
export interface Owned extends Skin { uid: string; paidAt: number }
export interface HistoryEntry { uid: string; name: string; image: string; price: number; method: "pix" | "card"; date: number; status: string }

interface CartCtx {
  items: Skin[];
  toggle: (s: Skin) => void;
  add: (s: Skin, qty: number) => void;
  removeAt: (i: number) => void;
  count: (id: string) => number;
  has: (id: string) => boolean;
  clear: () => void;
  total: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  user: User | null;
  authReady: boolean;
  inventory: Owned[];
  history: HistoryEntry[];
  balance: number;
  refresh: () => Promise<void>;
}

// Keep a single context instance across hot reloads so provider and consumers always match.
const g = globalThis as unknown as { __csgomoneyCartCtx?: Context<CartCtx | null> };
const Ctx = (g.__csgomoneyCartCtx ??= createContext<CartCtx | null>(null));

const STATUS: Record<string, string> = { owned: "Pagamento confirmado", sold: "Vendido", transferred: "Transferido p/ conta" };

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Skin[]>([]);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [inventory, setInventory] = useState<Owned[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [balance, setBalance] = useState(0);

  const refresh = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setInventory([]); setHistory([]); setBalance(0); return; }
    const { data } = await supabase.from("purchases").select("*").order("created_at", { ascending: false });
    const rows = data ?? [];
    const img = (id: string) => skins.find((s) => s.id === id);
    setInventory(rows.filter((r) => r.state === "owned").map((r) => {
      const base = img(r.skin_id);
      return { ...(base as Skin), name: r.name, price: Number(r.price), uid: r.id, paidAt: Date.parse(r.created_at) };
    }));
    setHistory(rows.map((r) => ({
      uid: r.id, name: r.name, image: img(r.skin_id)?.image ?? "", price: Number(r.price),
      method: r.method === "card" ? "card" : "pix", date: Date.parse(r.created_at), status: STATUS[r.state] ?? r.state,
    })));
    setBalance(Math.round(rows.reduce((a, r) => a + (r.state === "sold" ? Number(r.sale_value ?? 0) : 0), 0) * 100) / 100);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { setUser(data.user); setAuthReady(true); refresh(); });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setUser(session?.user ?? null);
      refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const toggle = (s: Skin) =>
    setItems((cur) => (cur.some((i) => i.id === s.id) ? cur.filter((i) => i.id !== s.id) : [...cur, s]));

  const add = (s: Skin, qty: number) =>
    setItems((cur) => {
      const n = Math.max(0, Math.min(qty, 10 - cur.filter((i) => i.id === s.id).length));
      return [...cur, ...Array.from({ length: n }, () => s)];
    });
  const removeAt = (idx: number) => setItems((cur) => cur.filter((_, i) => i !== idx));

  return (
    <Ctx.Provider
      value={{
        items, toggle, add, removeAt,
        count: (id) => items.filter((i) => i.id === id).length,
        has: (id) => items.some((i) => i.id === id),
        clear: () => setItems([]),
        total: items.reduce((a, b) => a + b.price, 0),
        open, setOpen, user, authReady, inventory, history, balance, refresh,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}

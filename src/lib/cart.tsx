import { type Context, createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Skin } from "./skins";

export const SELL_FEE = 0.08;
export interface Owned extends Skin { uid: string; paidAt: number }
export interface HistoryEntry { uid: string; name: string; image: string; price: number; method: "pix" | "card"; date: number; status: string }
const KEY = "csgomoney-inv";
function readStore(): { inventory: Owned[]; balance: number; history: HistoryEntry[] } {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || "{}");
    return { inventory: Array.isArray(d.inventory) ? d.inventory : [], balance: typeof d.balance === "number" ? d.balance : 0, history: Array.isArray(d.history) ? d.history : [] };
  } catch { return { inventory: [], balance: 0, history: [] }; }
}

interface CartCtx {
  items: Skin[];
  toggle: (s: Skin) => void;
  has: (id: string) => boolean;
  clear: () => void;
  total: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  inventory: Owned[];
  balance: number;
  addPurchased: (s: Skin[], method?: "pix" | "card") => void;
  history: HistoryEntry[];
  sellItem: (uid: string) => number;
  transferItem: (uid: string) => void;
}

// Keep a single context instance across hot reloads so provider and consumers always match.
const g = globalThis as unknown as { __csgomoneyCartCtx?: Context<CartCtx | null> };
const Ctx = (g.__csgomoneyCartCtx ??= createContext<CartCtx | null>(null));

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Skin[]>([]);
  const [open, setOpen] = useState(false);
  const [inventory, setInventory] = useState<Owned[]>([]);
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const d = readStore();
    setInventory(d.inventory); setBalance(d.balance); setHistory(d.history);
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify({ inventory, balance, history }));
  }, [inventory, balance, history, loaded]);

  const toggle = (s: Skin) =>
    setItems((cur) => (cur.some((i) => i.id === s.id) ? cur.filter((i) => i.id !== s.id) : [...cur, s]));
  const addPurchased = (list: Skin[], method: "pix" | "card" = "pix") => {
    if (!list.length) return;
    const now = Date.now();
    const owned: Owned[] = list.map((s) => ({ ...s, uid: `${s.id}-${now}-${Math.random().toString(36).slice(2, 7)}`, paidAt: now }));
    const entries: HistoryEntry[] = owned.map((o) => ({ uid: o.uid, name: o.name, image: o.image, price: o.price, method, date: now, status: "Pagamento confirmado" }));
    // Write storage immediately so the purchase is never lost, even if the page closes right away.
    const d = readStore();
    localStorage.setItem(KEY, JSON.stringify({ ...d, inventory: [...owned, ...d.inventory], history: [...entries, ...d.history] }));
    setInventory((cur) => [...owned, ...cur]);
    setHistory((cur) => [...entries, ...cur]);
  };
  const sellItem = (uid: string) => {
    const it = inventory.find((i) => i.uid === uid);
    if (!it) return 0;
    const v = Math.round(it.price * (1 - SELL_FEE) * 100) / 100;
    setInventory((cur) => cur.filter((i) => i.uid !== uid));
    setBalance((b) => Math.round((b + v) * 100) / 100);
    return v;
  };
  const transferItem = (uid: string) => setInventory((cur) => cur.filter((i) => i.uid !== uid));

  return (
    <Ctx.Provider
      value={{
        items, toggle,
        has: (id) => items.some((i) => i.id === id),
        clear: () => setItems([]),
        total: items.reduce((a, b) => a + b.price, 0),
        open, setOpen, inventory, history, balance, addPurchased, sellItem, transferItem,
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

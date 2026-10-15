import { type Context, createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Skin } from "./skins";

export const SELL_FEE = 0.08;
export interface Owned extends Skin { uid: string; paidAt: number }

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
  addPurchased: (s: Skin[]) => void;
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
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem("csgomoney-inv") || "{}");
      if (Array.isArray(d.inventory)) setInventory(d.inventory);
      if (typeof d.balance === "number") setBalance(d.balance);
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem("csgomoney-inv", JSON.stringify({ inventory, balance }));
  }, [inventory, balance, loaded]);

  const toggle = (s: Skin) =>
    setItems((cur) => (cur.some((i) => i.id === s.id) ? cur.filter((i) => i.id !== s.id) : [...cur, s]));
  const addPurchased = (list: Skin[]) =>
    setInventory((cur) => [
      ...list.map((s) => ({ ...s, uid: `${s.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, paidAt: Date.now() })),
      ...cur,
    ]);
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
        open, setOpen, inventory, balance, addPurchased, sellItem, transferItem,
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

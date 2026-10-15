import { createContext, useContext, useState, type ReactNode } from "react";
import type { Skin } from "./skins";

interface CartCtx {
  items: Skin[];
  toggle: (s: Skin) => void;
  has: (id: string) => boolean;
  clear: () => void;
  total: number;
  open: boolean;
  setOpen: (v: boolean) => void;
}

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Skin[]>([]);
  const [open, setOpen] = useState(false);
  const toggle = (s: Skin) =>
    setItems((cur) => (cur.some((i) => i.id === s.id) ? cur.filter((i) => i.id !== s.id) : [...cur, s]));
  return (
    <Ctx.Provider
      value={{
        items,
        toggle,
        has: (id) => items.some((i) => i.id === id),
        clear: () => setItems([]),
        total: items.reduce((a, b) => a + b.price, 0),
        open,
        setOpen,
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

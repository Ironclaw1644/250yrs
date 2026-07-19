"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Client cart (bondandfifth model): localStorage-persisted context.
 * Line identity = product::variant::sizeKey — the same garment in two sizes
 * is two lines. `sizeKey` packs one or two dimensions ("M" or "garment:M|shoe:us_10").
 */
export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  variantId: string | null;
  variantLabel: string | null;
  sizeKey: string | null;
  sizeLabel: string | null;
  unitPriceCents: number;
  quantity: number;
  imageUrl: string | null;
  freeShipping: boolean;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotalCents: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  keyOf: (line: Pick<CartLine, "productId" | "variantId" | "sizeKey">) => string;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "wear.cart.v1";

function lineKey(l: Pick<CartLine, "productId" | "variantId" | "sizeKey">): string {
  return `${l.productId}::${l.variantId ?? ""}::${l.sizeKey ?? ""}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, hydrated]);

  const add = useCallback((line: Omit<CartLine, "quantity">, quantity = 1) => {
    setLines((prev) => {
      const key = lineKey(line);
      const existing = prev.find((l) => lineKey(l) === key);
      if (existing) {
        return prev.map((l) =>
          lineKey(l) === key ? { ...l, quantity: Math.min(10, l.quantity + quantity) } : l,
        );
      }
      return [...prev, { ...line, quantity: Math.min(10, Math.max(1, quantity)) }];
    });
    setOpen(true);
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => lineKey(l) !== key)
        : prev.map((l) => (lineKey(l) === key ? { ...l, quantity: Math.min(10, quantity) } : l)),
    );
  }, []);

  const remove = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => lineKey(l) !== key));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((s, l) => s + l.quantity, 0);
    const subtotalCents = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
    return { lines, count, subtotalCents, open, setOpen, add, setQuantity, remove, clear, keyOf: lineKey };
  }, [lines, open, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

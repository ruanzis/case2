import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { skins } from "./skins";

const BASE = "https://mycash.cc/api/v1/pix";

function key() {
  const k = process.env["MYCASH_API_KEY"];
  if (!k) throw new Error("Pagamento Pix não configurado.");
  return k;
}

export const createPix = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ ids: z.array(z.string()).min(1).max(100) }).parse(d))
  .handler(async ({ data }) => {
    // Price is computed on the server from the catalog, never trusted from the browser.
    const total = data.ids.reduce((sum, id) => {
      const s = skins.find((x) => x.id === id);
      if (!s) throw new Error("Item inválido no carrinho.");
      return sum + s.price;
    }, 0);
    const amount = Math.round(total * 100) / 100;
    const res = await fetch(`${BASE}/generate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.pix_code) {
      console.error("mycash generate failed", res.status, body);
      if (body.code === "AMOUNT_BELOW_MIN" || body.code === "AMOUNT_ABOVE_MAX")
        return { error: `Pix aceita valores entre R$ ${body.min ?? 10} e R$ ${body.max ?? 500}.` };
      if (body.code === "RATE_LIMITED") return { error: "Muitas tentativas. Aguarde alguns segundos." };
      return { error: body.error ?? "Não foi possível gerar o Pix." };
    }
    return { pixCode: String(body.pix_code), reference: String(body.reference), amount };
  });

export const checkPix = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ reference: z.string().regex(/^[A-Za-z0-9_-]{1,80}$/) }).parse(d))
  .handler(async ({ data }) => {
    const res = await fetch(`${BASE}/status/${data.reference}`, {
      headers: { Authorization: `Bearer ${key()}` },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { status: "pending", isFinal: false };
    return { status: String(body.status), isFinal: Boolean(body.is_final) };
  });

import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Send, Zap } from "lucide-react";
import { useCart, SELL_FEE } from "@/lib/cart";
import { brl } from "@/lib/skins";
import { useServerFn } from "@tanstack/react-start";
import { sellPurchase, transferPurchase } from "@/lib/pix.functions";
import { LoginPrompt } from "@/components/LoginPrompt";

export const Route = createFileRoute("/venda-instantanea")({
  head: () => ({
    meta: [
      { title: "Venda instantânea — csgomoney.site" },
      { name: "description", content: "Venda na hora as skins compradas no csgomoney.site ou transfira para sua conta." },
      { property: "og:title", content: "Venda instantânea — csgomoney.site" },
      { property: "og:description", content: "Venda suas skins de CS2 na hora ou transfira para sua conta Steam." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { inventory, balance, refresh, user, authReady } = useCart();
  const sell = useServerFn(sellPurchase);
  const transfer = useServerFn(transferPurchase);
  if (authReady && !user) return <LoginPrompt text="Entre na sua conta para ver seus itens comprados." />;
  const sellItem = async (id: string) => {
    try { const r = await sell({ data: { id } }); toast.success(`Vendido! ${brl(r.value)} adicionado ao saldo.`); }
    catch { toast.error("Não foi possível vender o item."); }
    refresh();
  };
  const transferItem = async (id: string) => {
    try { await transfer({ data: { id } }); toast.success("Transferência para sua conta solicitada."); }
    catch { toast.error("Não foi possível transferir o item."); }
    refresh();
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Venda instantânea</h1>
          <p className="text-sm text-muted-foreground">Itens comprados ficam aqui. Venda na hora (taxa de {SELL_FEE * 100}%) ou transfira para sua conta.</p>
        </div>
        <div className="rounded-md bg-secondary px-4 py-2 text-sm">Saldo: <span className="font-semibold">{brl(balance)}</span></div>
      </div>
      {inventory.length === 0 ? (
        <p className="rounded-md bg-card p-8 text-center text-sm text-muted-foreground">Nenhum item disponível. Compre skins na loja e elas aparecerão aqui após o pagamento.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {inventory.map((i) => {
            const net = i.price * (1 - SELL_FEE);
            return (
              <div key={i.uid} className="flex flex-col rounded-lg bg-card p-3">
                <img src={i.image} alt={i.name} className="mx-auto h-24 object-contain" />
                <p className="mt-2 truncate text-xs">{i.name}</p>
                <p className="text-xs text-muted-foreground">Pago: {brl(i.price)}</p>
                <p className="text-sm font-semibold text-primary">Venda: {brl(net)}</p>
                <div className="mt-2 grid gap-1.5">
                  <button
                    onClick={() => sellItem(i.uid)}
                    className="flex items-center justify-center gap-1 rounded-md bg-primary py-1.5 text-xs font-medium text-primary-foreground"
                  ><Zap className="h-3 w-3" /> Vender Item</button>
                  <button
                    onClick={() => transferItem(i.uid)}
                    className="flex items-center justify-center gap-1 rounded-md border py-1.5 text-xs"
                  ><Send className="h-3 w-3" /> Transferir p/ conta</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

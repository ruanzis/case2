import { createFileRoute } from "@tanstack/react-router";
import { History, CheckCircle2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { brl } from "@/lib/skins";
import { LoginPrompt } from "@/components/LoginPrompt";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico — csgomoney.site" },
      { name: "description", content: "Histórico das suas compras de skins com status e data." },
      { property: "og:title", content: "Histórico — csgomoney.site" },
      { property: "og:description", content: "Suas transações no csgomoney.site." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Historico,
});

function Historico() {
  const { history, user, authReady } = useCart();
  if (authReady && !user) return <LoginPrompt text="Entre na sua conta para ver seu histórico de compras." />;
  if (!history.length)
    return (
      <div className="flex flex-col items-center justify-center rounded-xl bg-surface py-24 text-center">
        <History className="h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 font-display text-2xl font-bold">Nenhuma transação ainda</h1>
        <p className="mt-2 text-sm text-muted-foreground">Suas compras confirmadas aparecerão aqui.</p>
      </div>
    );
  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-bold">Histórico</h1>
      <div className="space-y-2">
        {history.map((h) => (
          <div key={h.uid} className="flex items-center gap-3 rounded-lg bg-surface p-3">
            <img src={h.image} alt={h.name} className="h-12 w-16 object-contain" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{h.name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(h.date).toLocaleString("pt-BR")} · {h.method === "pix" ? "Pix" : "Cartão"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{brl(h.price)}</p>
              <p className="flex items-center justify-end gap-1 text-xs text-primary">
                <CheckCircle2 className="h-3 w-3" /> {h.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

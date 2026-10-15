import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico — csgomoney.site" },
      { name: "description", content: "Histórico das suas compras e vendas de skins." },
      { property: "og:title", content: "Histórico — csgomoney.site" },
      { property: "og:description", content: "Suas transações no csgomoney.site." },
    ],
  }),
  component: () => (
    <div className="flex flex-col items-center justify-center rounded-xl bg-surface py-24 text-center">
      <History className="h-10 w-10 text-muted-foreground" />
      <h1 className="mt-4 font-display text-2xl font-bold">Nenhuma transação ainda</h1>
      <p className="mt-2 text-sm text-muted-foreground">Entre com a Steam para ver suas compras e vendas.</p>
    </div>
  ),
});

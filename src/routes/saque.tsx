import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/saque")({
  head: () => ({
    meta: [
      { title: "Saque — csgomoney.site" },
      { name: "description", content: "Venda skins por dinheiro real e saque via Pix ou cartão." },
      { property: "og:title", content: "Saque — csgomoney.site" },
      { property: "og:description", content: "Saque seu saldo via Pix ou cartão. Em breve." },
    ],
  }),
  component: () => (
    <ComingSoon title="Venda skins por dinheiro real e saque via Pix" text="Entre com a Steam e transforme suas skins em saldo para sacar." perk="100% seguro" />
  ),
});

import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/p2p")({
  head: () => ({
    meta: [
      { title: "P2P Venda — csgomoney.site" },
      { name: "description", content: "Venda suas skins de CS2 diretamente para outros jogadores." },
      { property: "og:title", content: "P2P Venda — csgomoney.site" },
      { property: "og:description", content: "Venda P2P de skins de CS2. Em breve." },
    ],
  }),
  component: () => (
    <ComingSoon title="Venda P2P de skins direto para jogadores" text="Defina seu preço e venda para outros jogadores com segurança." perk="Taxas reduzidas no P2P" />
  ),
});

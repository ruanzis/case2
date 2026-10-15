import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/venda-instantanea")({
  head: () => ({
    meta: [
      { title: "Venda instantânea — csgomoney.site" },
      { name: "description", content: "Venda instantânea das skins compradas no csgomoney.site. Em desenvolvimento." },
      { property: "og:title", content: "Venda instantânea — csgomoney.site" },
      { property: "og:description", content: "Venda suas skins de CS2 na hora. Em breve." },
    ],
  }),
  component: () => (
    <ComingSoon
      title="Venda instantânea de skins de CS2 com saque fácil"
      text="Venda instantaneamente cada item que você comprou no csgomoney.site e receba o valor na sua conta."
      perk="+8% usando Venda Instantânea"
    />
  ),
});

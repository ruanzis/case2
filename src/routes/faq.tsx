import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — csgomoney.site" },
      { name: "description", content: "Perguntas frequentes sobre compra e entrega de skins no csgomoney.site." },
      { property: "og:title", content: "FAQ — csgomoney.site" },
      { property: "og:description", content: "Tire suas dúvidas sobre o csgomoney.site." },
    ],
  }),
  component: Faq,
});

const qa = [
  ["Como recebo minha skin?", "Após o pagamento, a skin é enviada por oferta de troca na Steam. Itens com o selo 1m chegam em cerca de 1 minuto."],
  ["Quais formas de pagamento?", "Pix e cartão de crédito."],
  ["Posso vender o item que comprei?", "Sim. A Venda instantânea está em desenvolvimento e estará disponível em breve."],
  ["O que significa ST e FN/MW/FT/BS?", "ST é StatTrak™. FN, MW, FT e BS indicam o desgaste: Nova de Fábrica, Pouco Usada, Testada em Campo e Bem Desgastada."],
];

function Faq() {
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <h1 className="mb-6 font-display text-3xl font-bold">Perguntas frequentes</h1>
      {qa.map(([q, a]) => (
        <details key={q} className="rounded-lg bg-surface p-4">
          <summary className="cursor-pointer font-medium">{q}</summary>
          <p className="mt-2 text-sm text-muted-foreground">{a}</p>
        </details>
      ))}
    </div>
  );
}

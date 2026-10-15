import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Zap } from "lucide-react";
import { SkinCard } from "@/components/SkinCard";
import { skins, INSTANT_COUNT, type Category } from "@/lib/skins";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { useSubscription } from "@/lib/use-subscription";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "csgomoney.site — Comprar skins de CS2" },
      { name: "description", content: "Compre skins de CS2 com entrega instantânea e pagamento seguro." },
      { property: "og:title", content: "csgomoney.site — Comprar skins de CS2" },
      { property: "og:description", content: "Market de skins de CS2 com entrega instantânea." },
    ],
  }),
  component: Market,
});

const cats: ("Todos" | Category)[] = ["Todos", "Rifle", "Faca", "Luvas", "Adesivo", "SMG", "Pistola"];
type Sort = "default" | "asc" | "desc";

function Market() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof cats)[number]>("Todos");
  const [speed, setSpeed] = useState<"any" | "1m" | "15m">("any");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [sort, setSort] = useState<Sort>("default");

  const instant = skins.slice(0, INSTANT_COUNT);
  const list = useMemo(() => {
    let r = skins.slice(INSTANT_COUNT).filter(
      (s) =>
        s.name.toLowerCase().includes(q.toLowerCase()) &&
        (cat === "Todos" || s.category === cat) &&
        (speed === "any" || s.delivery === speed || (speed === "15m" && s.delivery === "1m")) &&
        (!min || s.price >= Number(min)) &&
        (!max || s.price <= Number(max)),
    );
    if (sort === "asc") r = [...r].sort((a, b) => a.price - b.price);
    if (sort === "desc") r = [...r].sort((a, b) => b.price - a.price);
    return r;
  }, [q, cat, speed, min, max, sort]);

  const { active } = useSubscription();
  if (active === null) return <p className="py-10 text-center text-sm text-muted-foreground">Carregando...</p>;
  if (!active)
    return (
      <div className="mx-auto max-w-md space-y-3 rounded-xl bg-surface p-6 text-center">
        <h1 className="font-display text-xl font-bold">Lista de skins para assinantes</h1>
        <p className="text-sm text-muted-foreground">Assine por R$ 41,40 (pagamento único via Pix) para ver a lista completa de skins atualizada.</p>
        <Link to="/assinatura" className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Ver assinatura</Link>
      </div>
    );

  return (
    <div className="flex gap-4">
      <aside className="hidden w-52 shrink-0 space-y-6 rounded-lg bg-surface p-4 text-sm lg:block">
        <h2 className="font-semibold">Filtros</h2>
        <div>
          <p className="mb-2 font-medium">Preço</p>
          <div className="flex items-center gap-2">
            <input value={min} onChange={(e) => setMin(e.target.value)} placeholder="R$ 0,00" type="number" className="w-full rounded bg-input px-2 py-1.5 text-xs outline-none" />
            <span>–</span>
            <input value={max} onChange={(e) => setMax(e.target.value)} placeholder="R$ 0,00" type="number" className="w-full rounded bg-input px-2 py-1.5 text-xs outline-none" />
          </div>
        </div>
        <div>
          <p className="mb-2 font-medium">Velocidade de entrega</p>
          {([["1m", "Instantânea"], ["15m", "Aprox. 15 minutos"], ["any", "Qualquer uma"]] as const).map(([v, l]) => (
            <button key={v} onClick={() => setSpeed(v)} className={cn("mb-1 flex w-full items-center gap-2 rounded-full px-3 py-1.5 text-left text-xs", speed === v ? "bg-instant text-primary-foreground" : "text-muted-foreground")}>
              <span className={cn("h-3 w-3 rounded-full border", speed === v && "border-primary-foreground bg-primary-foreground")} />{l}
            </button>
          ))}
        </div>
        <div>
          <p className="mb-2 font-medium">Categoria</p>
          <div className="flex flex-wrap gap-1">
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={cn("rounded px-2 py-1 text-xs", cat === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>{c}</button>
            ))}
          </div>
        </div>
        <button onClick={() => { setQ(""); setCat("Todos"); setSpeed("any"); setMin(""); setMax(""); }} className="w-full rounded bg-secondary py-1.5 text-xs text-destructive">Resetar</button>
      </aside>

      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-md bg-surface px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca..." className="w-full bg-transparent py-2 text-sm outline-none" />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-md bg-surface px-3 text-sm outline-none">
            <option value="default">Ordenação padrão</option>
            <option value="asc">Menor preço</option>
            <option value="desc">Maior preço</option>
          </select>
        </div>

        <section className="rounded-xl bg-banner p-3">
          <h2 className="mb-3 flex items-center gap-2 px-1 font-display text-xl font-bold italic text-primary-foreground">
            <Zap className="h-5 w-5" /> ENTREGA INSTANTÂNEA
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {instant.map((s) => (
              <div key={s.id} className="w-36 shrink-0"><SkinCard s={s} /></div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {list.map((s) => <SkinCard key={s.id} s={s} />)}
        </div>
        {list.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Nenhum item encontrado.</p>}
      </div>
    </div>
  );
}

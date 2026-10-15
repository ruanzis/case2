import { Construction } from "lucide-react";
import { toast } from "sonner";

export function ComingSoon({ title, text, perk }: { title: string; text: string; perk: string }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="flex flex-col justify-center rounded-xl bg-surface p-8">
        <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-stattrak/15 px-3 py-1 text-xs text-stattrak">
          <Construction className="h-3.5 w-3.5" /> Em desenvolvimento
        </span>
        <h1 className="font-display text-3xl font-bold leading-tight">{title}</h1>
        <p className="mt-4 text-sm text-muted-foreground">{text}</p>
        <button onClick={() => toast.info("Essa função estará disponível em breve.")} className="mt-6 w-fit rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground">
          Negocie JÁ!
        </button>
      </div>
      <div className="flex flex-col justify-end rounded-xl bg-hero p-8">
        <p className="font-display text-6xl font-bold text-primary">+8%</p>
        <h2 className="mt-6 text-lg font-semibold">{perk}</h2>
        <p className="mt-2 text-sm text-muted-foreground">Estamos finalizando essa área. Em breve você poderá vender cada item comprado aqui de forma instantânea.</p>
      </div>
    </div>
  );
}

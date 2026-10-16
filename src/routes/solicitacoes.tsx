import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listWithdrawals, setWithdrawalStatus } from "@/lib/withdraw.functions";
import { brl } from "@/lib/skins";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/solicitacoes")({
  head: () => ({
    meta: [
      { title: "Solicitações de saque — csgomoney" },
      { name: "description", content: "Painel de análise das solicitações de saque." },
      { property: "og:title", content: "Solicitações de saque — csgomoney" },
      { property: "og:description", content: "Painel de análise das solicitações de saque." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

type Row = { id: string; email: string | null; pix_key: string; pix_type: string; amount: number; status: string; created_at: string };
const label: Record<string, string> = { pending: "Em análise", approved: "Aprovado", rejected: "Recusado" };

function Page() {
  const list = useServerFn(listWithdrawals);
  const setStatus = useServerFn(setWithdrawalStatus);
  const [state, setState] = useState<{ admin: boolean; rows: Row[] } | null>(null);
  const load = () => list().then((r) => setState(r as { admin: boolean; rows: Row[] }));
  useEffect(() => { load(); }, []);

  if (!state) return <p className="p-6 text-muted-foreground">Carregando...</p>;
  if (!state.admin) return <p className="p-6 text-muted-foreground">Acesso restrito.</p>;
  return (
    <div className="mx-auto max-w-3xl space-y-3 p-4">
      <h1 className="text-xl font-bold">Solicitações de saque</h1>
      {state.rows.length === 0 && <p className="text-muted-foreground">Nenhuma solicitação.</p>}
      {state.rows.map((r) => (
        <div key={r.id} className="space-y-2 rounded-xl border border-border bg-card p-4 text-sm">
          <div className="flex justify-between"><b>{r.email ?? "—"}</b><span>{brl(Number(r.amount))}</span></div>
          <p>Pix ({r.pix_type}): {r.pix_key}</p>
          <p className="text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")} · {label[r.status] ?? r.status}</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={async () => { await setStatus({ data: { id: r.id, status: "approved" } }); load(); }}>Aprovar</Button>
            <Button size="sm" variant="outline" onClick={async () => { await setStatus({ data: { id: r.id, status: "rejected" } }); load(); }}>Recusar</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AlertTriangle, RotateCw, X } from "lucide-react";
import { startSteamLink, getSteamAccount, disconnectSteam } from "@/lib/steam.functions";

const ERRORS: Record<string, { title: string; text: string; retry: boolean }> = {
  cancel: { title: "Conexão cancelada", text: "Você saiu da página da Steam antes de concluir o login. Nada foi alterado.", retry: true },
  invalid: { title: "A Steam não confirmou o login", text: "Não conseguimos validar a resposta da Steam. Isso acontece quando o login expira ou é interrompido.", retry: true },
  expired: { title: "Tempo esgotado", text: "O pedido de conexão passou de 15 minutos ou já foi usado. Comece de novo.", retry: true },
  unreachable: { title: "Steam fora do ar", text: "Não conseguimos falar com a Steam agora. Aguarde um pouco e tente de novo.", retry: true },
  server: { title: "Erro ao salvar", text: "O login na Steam deu certo, mas não conseguimos salvar a conexão. Tente de novo.", retry: true },
  start: { title: "Não foi possível abrir a Steam", text: "Verifique sua internet e tente de novo.", retry: true },
  unverified: { title: "Confirme seu e-mail primeiro", text: "Para conectar a Steam, sua conta precisa estar com o e-mail confirmado. Abra o link que enviamos ao seu e-mail e entre de novo.", retry: false },
};

export function SteamConnect() {
  const start = useServerFn(startSteamLink);
  const get = useServerFn(getSteamAccount);
  const disc = useServerFn(disconnectSteam);
  const [steamId, setSteamId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    get().then((r) => setSteamId(r?.steamId ?? null)).catch(() => {});
    const p = new URLSearchParams(window.location.search).get("steam");
    if (p) {
      if (p === "ok") toast.success("Conta Steam conectada!");
      else setErr(ERRORS[p] ? p : "invalid");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [get]);

  const connect = useCallback(async () => {
    setErr(null);
    setBusy(true);
    try {
      const { url } = await start({ data: { origin: window.location.origin } });
      if (window.self !== window.top) {
        window.open(url, "_blank", "noopener");
        setBusy(false);
        toast.info("A Steam abriu em uma nova aba.");
      } else window.location.href = url;
    } catch (e) {
      setBusy(false);
      setErr(e instanceof Error && e.message.includes("EMAIL_UNVERIFIED") ? "unverified" : "start");
    }
  }, [start]);

  const info = err ? ERRORS[err] : null;

  return (
    <>
      {steamId ? (
        <button
          onClick={async () => {
            if (!confirm("Desconectar sua conta Steam?")) return;
            await disc(); setSteamId(null); toast.success("Steam desconectada.");
          }}
          className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
          title={`SteamID ${steamId}`}
        >
          <SteamIcon /> <span className="hidden sm:inline">Steam conectada</span>
        </button>
      ) : (
        <button
          disabled={busy}
          onClick={connect}
          className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          <SteamIcon /> <span className="hidden sm:inline">{busy ? "Abrindo..." : "Conectar Conta"}</span>
        </button>
      )}
      {info && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4" onClick={() => setErr(null)}>
          <div className="w-full max-w-sm rounded-lg border bg-surface p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div className="flex-1">
                <h3 className="font-display font-semibold">{info.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{info.text}</p>
              </div>
              <button onClick={() => setErr(null)} aria-label="Fechar"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setErr(null)} className="rounded-md border px-3 py-1.5 text-sm">Fechar</button>
              {info.retry && (
                <button onClick={connect} disabled={busy} className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-60">
                  <RotateCw className="h-4 w-4" /> Tentar novamente
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SteamIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-9.96 9.2l5.36 2.21a2.83 2.83 0 0 1 1.6-.49l2.39-3.46v-.05a3.78 3.78 0 1 1 3.78 3.78h-.09l-3.4 2.43a2.84 2.84 0 0 1-5.63.56L2.2 15.2A10 10 0 1 0 12 2Zm-4.3 15.18-1.23-.5a2.13 2.13 0 1 0 1.17-2.9l1.27.52a1.57 1.57 0 1 1-1.2 2.9Zm9.43-7.58a2.52 2.52 0 1 0-2.52 2.52 2.52 2.52 0 0 0 2.52-2.52Zm-4.4 0a1.89 1.89 0 1 1 1.89 1.89 1.89 1.89 0 0 1-1.9-1.89Z" />
    </svg>
  );
}

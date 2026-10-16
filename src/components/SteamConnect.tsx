import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { startSteamLink, getSteamAccount, disconnectSteam } from "@/lib/steam.functions";

export function SteamConnect() {
  const start = useServerFn(startSteamLink);
  const get = useServerFn(getSteamAccount);
  const disc = useServerFn(disconnectSteam);
  const [steamId, setSteamId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    get().then((r) => setSteamId(r?.steamId ?? null)).catch(() => {});
    const p = new URLSearchParams(window.location.search).get("steam");
    if (p) {
      if (p === "ok") toast.success("Conta Steam conectada!");
      else if (p === "error") toast.error("Não foi possível conectar a Steam.");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [get]);

  if (steamId) {
    return (
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
    );
  }
  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const { url } = await start({ data: { origin: window.location.origin } });
          if (window.self !== window.top) { window.open(url, "_blank", "noopener"); setBusy(false); toast.info("A Steam abriu em uma nova aba."); }
          else window.location.href = url;
        } catch { toast.error("Não foi possível iniciar a conexão."); setBusy(false); }
      }}
      className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
    >
      <SteamIcon /> <span className="hidden sm:inline">Conectar Conta</span>
    </button>
  );
}

function SteamIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-9.96 9.2l5.36 2.21a2.83 2.83 0 0 1 1.6-.49l2.39-3.46v-.05a3.78 3.78 0 1 1 3.78 3.78h-.09l-3.4 2.43a2.84 2.84 0 0 1-5.63.56L2.2 15.2A10 10 0 1 0 12 2Zm-4.3 15.18-1.23-.5a2.13 2.13 0 1 0 1.17-2.9l1.27.52a1.57 1.57 0 1 1-1.2 2.9Zm9.43-7.58a2.52 2.52 0 1 0-2.52 2.52 2.52 2.52 0 0 0 2.52-2.52Zm-4.4 0a1.89 1.89 0 1 1 1.89 1.89 1.89 1.89 0 0 1-1.9-1.89Z" />
    </svg>
  );
}

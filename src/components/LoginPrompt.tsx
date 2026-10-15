import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

export function LoginPrompt({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-surface py-24 text-center">
      <Lock className="h-10 w-10 text-muted-foreground" />
      <p className="mt-4 text-sm text-muted-foreground">{text}</p>
      <Link to="/auth" className="mt-4 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">
        Entrar ou criar conta
      </Link>
    </div>
  );
}

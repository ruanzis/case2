import { createFileRoute, redirect } from "@tanstack/react-router";

// Old address kept alive: links already shared (WhatsApp, Telegram) still work
// and land on the new page.
export const Route = createFileRoute("/auth")({
  beforeLoad: () => {
    throw redirect({ to: "/inicio", replace: true });
  },
  component: () => null,
});

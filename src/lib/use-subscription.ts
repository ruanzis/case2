import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "./cart";

export function useSubscription() {
  const { user } = useCart();
  const [active, setActive] = useState<boolean | null>(null);
  const refresh = useCallback(async () => {
    if (!user) return setActive(false);
    const { data } = await supabase.from("subscriptions").select("reference").eq("paid", true).limit(1);
    setActive(Boolean(data && data.length));
  }, [user]);
  useEffect(() => { void refresh(); }, [refresh]);
  return { active, refresh };
}

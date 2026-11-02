import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { checkoutStatusMessage } from "@/lib/billing";
import { useProfile } from "../../state/ProfileProvider";
import { useProgress } from "../../state/ProgressProvider";
import { Message, type Notice } from "./ui";

const POLL_MS = 2000;
const GIVE_UP_MS = 20_000;

/** ?checkout=success waits for the webhook. ?checkout=cancelled is a quiet note. */
export function CheckoutReturn() {
  const [params, setParams] = useSearchParams();
  const checkout = params.get("checkout");
  const { hasFullAccess, refresh } = useProfile();
  const { refresh: refreshProgress } = useProgress();
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    if (checkout !== "success" && checkout !== "cancelled") return undefined;
    const clearParam = () => {
      const next = new URLSearchParams(params);
      next.delete("checkout");
      setParams(next, { replace: true });
    };
    if (checkout === "cancelled") {
      setNotice({ tone: "info", text: checkoutStatusMessage("cancelled") });
      clearParam();
      return undefined;
    }

    let stopped = false;
    const started = Date.now();
    setNotice({ tone: "info", text: checkoutStatusMessage("pending") });

    const finish = async (phase: "ready" | "delayed") => {
      if (stopped) return;
      stopped = true;
      if (phase === "ready") await refreshProgress();
      setNotice({ tone: "info", text: checkoutStatusMessage(phase) });
      clearParam();
    };

    const tick = async () => {
      if (stopped) return;
      await refresh();
    };

    void tick();
    const id = window.setInterval(() => {
      if (Date.now() - started >= GIVE_UP_MS) {
        window.clearInterval(id);
        void finish("delayed");
        return;
      }
      void tick();
    }, POLL_MS);

    return () => {
      stopped = true;
      window.clearInterval(id);
    };
    // The query is the trigger. refresh identity changes after each poll; the interval owns the loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkout]);

  useEffect(() => {
    if (checkout !== "success" || !hasFullAccess) return;
    setNotice({ tone: "info", text: checkoutStatusMessage("ready") });
    void refreshProgress();
    const next = new URLSearchParams(params);
    next.delete("checkout");
    setParams(next, { replace: true });
  }, [checkout, hasFullAccess, params, refreshProgress, setParams]);

  return <Message notice={notice} />;
}

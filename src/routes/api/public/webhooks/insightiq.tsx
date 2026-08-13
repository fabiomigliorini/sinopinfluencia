import { createFileRoute } from "@tanstack/react-router";

/**
 * Provider webhook: whenever the aggregator finishes collecting data for a
 * connected account we re-sync that account. Payload is verified by matching the
 * account id against our own social_accounts rows plus a shared secret header.
 */
export const Route = createFileRoute("/api/public/webhooks/insightiq")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["INSIGHTIQ_WEBHOOK_SECRET"];
        if (secret) {
          const provided =
            request.headers.get("x-insightiq-secret") ??
            request.headers.get("x-webhook-secret") ??
            "";
          if (provided !== secret) return new Response("Invalid secret", { status: 401 });
        }

        let payload: Record<string, unknown>;
        try {
          payload = (await request.json()) as Record<string, unknown>;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const data = (payload["data"] ?? {}) as Record<string, unknown>;
        const accountIds = new Set<string>();
        for (const candidate of [
          data["account_id"],
          payload["account_id"],
          ...(Array.isArray(data["accounts"]) ? (data["accounts"] as unknown[]) : []),
        ]) {
          if (typeof candidate === "string") accountIds.add(candidate);
          else if (
            candidate &&
            typeof candidate === "object" &&
            typeof (candidate as { id?: unknown }).id === "string"
          ) {
            accountIds.add((candidate as { id: string }).id);
          }
        }

        if (accountIds.size === 0) return Response.json({ ok: true, synced: 0 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: rows } = await supabaseAdmin
          .from("social_accounts")
          .select("id")
          .in("provider_account_id", [...accountIds]);

        const { syncSocialAccount } = await import("@/lib/social.server");
        let synced = 0;
        for (const row of rows ?? []) {
          try {
            await syncSocialAccount(row.id);
            synced += 1;
          } catch (error) {
            console.error("[social] webhook sync failed", error);
          }
        }
        return Response.json({ ok: true, synced });
      },
    },
  },
});

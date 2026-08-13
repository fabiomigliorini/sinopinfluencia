import { createFileRoute } from "@tanstack/react-router";

/**
 * Daily refresh of every social handle informed by the creators, using public
 * data only. Protected by a shared secret so only the scheduler can trigger it.
 */
async function handle(request: Request) {
  const secret = process.env["SOCIAL_CRON_SECRET"];
  if (!secret) return new Response("Cron secret not configured", { status: 503 });

  const url = new URL(request.url);
  const provided =
    request.headers.get("x-cron-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    url.searchParams.get("secret") ??
    "";
  if (provided !== secret) return new Response("Unauthorized", { status: 401 });

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: accounts, error } = await supabaseAdmin
    .from("social_accounts")
    .select("id, network, handle")
    .eq("is_declared", false)
    .not("handle", "is", null);
  if (error) return new Response(error.message, { status: 500 });

  const { syncSocialAccount } = await import("@/lib/social.server");
  let synced = 0;
  const failures: Array<{ id: string; network: string; error: string }> = [];
  for (const account of accounts ?? []) {
    try {
      await syncSocialAccount(account.id);
      synced += 1;
    } catch (syncError) {
      failures.push({
        id: account.id,
        network: account.network,
        error: syncError instanceof Error ? syncError.message : "Erro desconhecido",
      });
    }
    // Small pause so the networks don't see a burst of requests.
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return Response.json({ ok: true, total: (accounts ?? []).length, synced, failures });
}

export const Route = createFileRoute("/api/public/cron/sync-social")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
});

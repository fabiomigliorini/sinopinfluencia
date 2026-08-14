export type PublicSocialAccount = {
  id: string;
  network: string;
  handle: string | null;
  profile_url: string | null;
  avatar_url: string | null;
  display_name: string | null;
  is_declared: boolean;
  declared_followers: string | null;
  last_synced_at: string | null;
  latest: {
    captured_at: string;
    followers: number | null;
    posts_count: number | null;
    avg_likes: number | null;
    avg_views: number | null;
  } | null;
};

const COLUMNS =
  "id, network, handle, profile_url, avatar_url, display_name, is_declared, declared_followers, last_synced_at";

/** Loads every social account of a profile with its most recent snapshot. */
export async function loadPublicSocialAccounts(
  supabase: any,
  profileId: string,
): Promise<PublicSocialAccount[]> {
  const { data } = await supabase
    .from("social_accounts")
    .select(COLUMNS)
    .eq("profile_id", profileId)
    .order("network", { ascending: true });

  const accounts = (data ?? []) as Array<any>;
  if (!accounts.length) return [];

  const { data: snapshots } = await supabase
    .from("social_snapshots")
    .select("social_account_id, captured_at, followers, posts_count, avg_likes, avg_views")
    .in(
      "social_account_id",
      accounts.map((a) => a.id),
    )
    .order("captured_at", { ascending: false });

  return accounts.map((account) => ({
    ...account,
    latest: (snapshots ?? []).find((s: any) => s.social_account_id === account.id) ?? null,
  })) as PublicSocialAccount[];
}

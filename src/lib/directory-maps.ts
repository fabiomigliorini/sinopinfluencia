import type { Database } from "@/integrations/supabase/types";

export type DirectoryMetric = {
  profile_id: string;
  network: string;
  followers: string | null;
};
type FormatRow = Database["public"]["Tables"]["profile_formats"]["Row"];

/** Groups social-account metrics by profile (a creator can have many handles). */
export function buildMetricsMap(metrics: DirectoryMetric[]) {
  const map: Record<string, DirectoryMetric[]> = {};
  for (const metric of metrics) {
    if (!metric.profile_id) continue;
    (map[metric.profile_id] ??= []).push(metric);
  }
  return map;
}

/** Groups work formats by profile so cards can show a real format label. */
export function buildFormatsMap(formats: Array<Partial<FormatRow>>) {
  const map: Record<string, string[]> = {};
  for (const format of formats) {
    const id = format.profile_id as string | undefined;
    if (!id || !format.format) continue;
    (map[id] ??= []).push(format.format);
  }
  return map;
}

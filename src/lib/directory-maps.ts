import type { Database } from "@/integrations/supabase/types";

type MetricRow = Database["public"]["Tables"]["profile_metrics"]["Row"];
type FormatRow = Database["public"]["Tables"]["profile_formats"]["Row"];

/** Groups all metric rows by profile (a creator can have many networks/handles). */
export function buildMetricsMap(metrics: Array<Partial<MetricRow>>) {
  const map: Record<string, MetricRow[]> = {};
  for (const metric of metrics) {
    const id = metric.profile_id as string | undefined;
    if (!id) continue;
    (map[id] ??= []).push(metric as MetricRow);
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

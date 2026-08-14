import { queryOptions } from "@tanstack/react-query";
import {
  getFilteredProfiles,
  listDirectoryMetadata,
  listProfiles,
} from "@/lib/profiles.functions";

export type DirectoryFilters = {
  q?: string | undefined;
  niche?: string | undefined;
  network?: string | undefined;
  tier?: string | undefined;
};

export const profilesQueryOptions = queryOptions({
  queryKey: ["profiles", "home"],
  queryFn: () => listProfiles(),
});

export const directoryQueryOptions = (filters: DirectoryFilters) =>
  queryOptions({
    queryKey: ["directory", filters],
    queryFn: () => getFilteredProfiles({ data: filters }),
  });

export const metadataQueryOptions = queryOptions({
  queryKey: ["directory-metadata"],
  queryFn: () => listDirectoryMetadata(),
});

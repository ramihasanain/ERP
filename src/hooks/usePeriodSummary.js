import { useCustomQuery } from "./useQuery";

export function usePeriodSummary(periodId) {
  const { data, isPending, isError, error } = useCustomQuery(
    `/api/auditing/portal/periods/${periodId}/summary`,
    ["period-summary", periodId],
    { enabled: !!periodId },
  );

  return {
    summary: data?.summary ?? null,
    quickStats: data?.quick_stats ?? null,
    isPending,
    isError,
    error,
  };
}

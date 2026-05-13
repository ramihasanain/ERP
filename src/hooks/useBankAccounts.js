import { useCustomQuery } from "./useQuery";

const QUERY_KEY = "period-bank-accounts";

export function useBankAccounts(periodId) {
  const url = `/api/auditing/portal/periods/${periodId}/bank-accounts/`;

  const { data, isPending, isError, error, refetch } = useCustomQuery(
    url,
    [QUERY_KEY, periodId],
    { enabled: !!periodId },
  );

  return {
    bankAccounts: data ?? [],
    isPending,
    isError,
    error,
    refetch,
  };
}

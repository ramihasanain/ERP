import { useCustomQuery } from "./useQuery";

const QUERY_KEY = "period-customers-vendors";

export function useCustomersVendors(periodId) {
  const url = `/api/auditing/portal/periods/${periodId}/customers-vendors/`;

  const { data, isPending, isError, error, refetch } = useCustomQuery(
    url,
    [QUERY_KEY, periodId],
    { enabled: !!periodId },
  );

  return {
    customers: data?.customers ?? [],
    vendors: data?.vendors ?? [],
    isPending,
    isError,
    error,
    refetch,
  };
}

import { useCustomQuery } from "./useQuery";

const QUERY_KEY = "period-trial-balance";

export function useTrialBalance(
  periodId,
  { asOf = "", includeZeroAccounts = false } = {},
) {
  const params = new URLSearchParams();
  if (asOf) params.append("as_of", asOf);
  if (includeZeroAccounts) params.append("include_zero_accounts", "true");

  const qs = params.toString();
  const url = `/api/auditing/portal/periods/${periodId}/trial-balance/${qs ? `?${qs}` : ""}`;

  const { data, isPending, isError, error, refetch } = useCustomQuery(
    url,
    [QUERY_KEY, periodId, asOf, includeZeroAccounts],
    { enabled: !!periodId && !!asOf },
  );

  const accounts = data?.accounts ?? [];

  const { totalDebit, totalCredit } = accounts.reduce(
    (acc, row) => ({
      totalDebit: acc.totalDebit + (Number(row.debit) || 0),
      totalCredit: acc.totalCredit + (Number(row.credit) || 0),
    }),
    { totalDebit: 0, totalCredit: 0 },
  );

  return {
    accounts,
    totalDebit,
    totalCredit,
    isPending,
    isError,
    error,
    refetch,
  };
}

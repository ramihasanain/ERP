import { useCustomQuery } from "./useQuery";

export const usePeriodAccounts = (periodId) => {
  return useCustomQuery(
    `/api/auditing/portal/periods/${periodId}/chart-of-accounts/`,
    ["period-chart-of-accounts", periodId],
    { enabled: !!periodId },
  );
};

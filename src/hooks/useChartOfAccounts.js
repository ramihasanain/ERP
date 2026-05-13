import { useCustomQuery } from "./useQuery";
import { useCustomPost } from "./useMutation";

const QUERY_KEY = "period-chart-of-accounts";

export function useAccountTypes() {
  const { data, isPending, isError } = useCustomQuery(
    "/api/shared/account-types/",
    ["account-types"],
  );

  const raw = data?.data ?? data ?? [];
  const accountTypes = Array.isArray(raw)
    ? raw.map((t) => ({ value: t.id, label: t.name }))
    : [];

  return {
    accountTypes,
    hasMore: !!data?.next,
    isAccountTypesLoading: isPending,
    isAccountTypesError: isError,
  };
}

export function useChartOfAccounts(periodId, { includeZeroAccounts = false } = {}) {
  const url = `/api/auditing/portal/periods/${periodId}/chart-of-accounts/${
    includeZeroAccounts ? "?include_zero_accounts=true" : ""
  }`;

  const { data, isPending, isError, error, refetch } = useCustomQuery(
    url,
    [QUERY_KEY, periodId, includeZeroAccounts],
    { enabled: !!periodId },
  );

  return {
    accounts: data ?? [],
    isPending,
    isError,
    error,
    refetch,
  };
}

export function useAccountChangeRequest(periodId) {
  const changeRequest = useCustomPost(
    `/api/auditing/portal/periods/${periodId}/change-requests/`,
    [[QUERY_KEY, periodId, false], [QUERY_KEY, periodId, true]],
  );

  const createAccount = (proposedPayload) =>
    changeRequest.mutateAsync({
      title: proposedPayload.name,
      target_area: "account",
      action: "create",
      proposed_payload: proposedPayload,
    });

  const updateAccount = (accountId, name) =>
    changeRequest.mutateAsync({
      title: name,
      target_area: "account",
      action: "update",
      target_object_id: accountId,
      proposed_payload: { name },
    });

  const deleteAccount = (accountId, name) =>
    changeRequest.mutateAsync({
      title: name,
      target_area: "account",
      action: "delete",
      target_object_id: accountId,
      proposed_payload: {},
    });

  return {
    createAccount,
    updateAccount,
    deleteAccount,
    isSubmitting: changeRequest.isPending,
  };
}

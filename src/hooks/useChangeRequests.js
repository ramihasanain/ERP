import { useCustomQuery } from "./useQuery";
import { useCustomPost } from "./useMutation";

const QUERY_KEY = "period-change-requests";

export function useChangeRequests(periodId) {
  const { data, isPending, isError, error, refetch } = useCustomQuery(
    `/api/auditing/portal/periods/${periodId}/change-requests/`,
    [QUERY_KEY, periodId],
    { enabled: !!periodId },
  );

  return {
    changeRequests: data?.data ?? [],
    summary: data?.summary ?? { draft: 0, submitted: 0, approved: 0, rejected: 0 },
    isPending,
    isError,
    error,
    refetch,
  };
}

export function useDeleteDrafts(periodId) {
  return useCustomPost(
    `/api/auditing/portal/periods/${periodId}/change-requests/delete-drafts/`,
    [QUERY_KEY, periodId],
  );
}

export function useSubmitChangeRequests(periodId) {
  return useCustomPost(
    `/api/auditing/portal/periods/${periodId}/submit-change-requests/`,
    [QUERY_KEY, periodId],
  );
}

export function useApproveAndSeal(periodId) {
  return useCustomPost(
    `/api/auditing/portal/periods/${periodId}/approve-and-seal/`,
    [QUERY_KEY, periodId],
  );
}

export function useRequestRevision(periodId) {
  return useCustomPost(
    `/api/auditing/portal/periods/${periodId}/request-revision/`,
    [QUERY_KEY, periodId],
  );
}

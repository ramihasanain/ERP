import { useCustomQuery } from "./useQuery";
import { useCustomPost } from "./useMutation";

const QUERY_KEY = "period-journal-entries";

export function useJournalEntries(periodId) {
  const { data, isPending, isError, error, refetch } = useCustomQuery(
    `/api/auditing/portal/periods/${periodId}/journal-entries/`,
    [QUERY_KEY, periodId],
    { enabled: !!periodId },
  );

  const changeRequest = useCustomPost(
    `/api/auditing/portal/periods/${periodId}/change-requests/`,
    [[QUERY_KEY, periodId]],
  );

  const createEntry = (payload) =>
    changeRequest.mutateAsync({
      title: payload.title,
      target_area: "journal_entry",
      action: "create",
      target_object_id: payload.target_object_id,
      proposed_payload: payload.proposed_payload,
    });

  const updateEntry = (entryId, proposedPayload) =>
    changeRequest.mutateAsync({
      title: `Update journal entry`,
      target_area: "journal_entry",
      action: "update",
      target_object_id: entryId,
      proposed_payload: proposedPayload,
    });

  const deleteEntry = (entryId) =>
    changeRequest.mutateAsync({
      title: `Delete journal entry`,
      target_area: "journal_entry",
      action: "delete",
      target_object_id: entryId,
      proposed_payload: {},
    });

  return {
    journalEntries: data ?? [],
    isPending,
    isError,
    error,
    refetch,
    createEntry,
    updateEntry,
    deleteEntry,
    isSubmitting: changeRequest.isPending,
  };
}

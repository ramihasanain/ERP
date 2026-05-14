import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import Spinner from "@/core/Spinner";
import ConfirmationModal from "@/components/Shared/ConfirmationModal";
import {
  useChangeRequests,
  useDeleteDrafts,
  useSubmitChangeRequests,
} from "@/hooks/useChangeRequests";
import ChangeRequestsList from "./ChangeRequestsList";

const AdjustmentsTab = () => {
  const { periodId } = useParams();
  const { changeRequests, summary, isPending, isError, error } =
    useChangeRequests(periodId);
  const deleteDrafts = useDeleteDrafts(periodId);
  const submitChangeRequests = useSubmitChangeRequests(periodId);

  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);

  const draftIds = useMemo(
    () =>
      changeRequests
        .filter((cr) => cr.status === "draft")
        .map((cr) => cr.id),
    [changeRequests],
  );

  const handleDeleteAll = () => {
    deleteDrafts.mutate(
      { ids: draftIds },
      {
        onSuccess: () => {
          toast.success("All draft change requests deleted.");
          setDeleteAllOpen(false);
        },
        onError: () => {
          toast.error("Failed to delete drafts. Please try again.");
        },
      },
    );
  };

  const handleDeleteOne = (id, onDone) => {
    deleteDrafts.mutate(
      { ids: [id] },
      {
        onSuccess: () => {
          toast.success("Change request deleted.");
          onDone?.();
        },
        onError: () => {
          toast.error("Failed to delete change request.");
          onDone?.();
        },
      },
    );
  };

  const handleSubmit = () => {
    submitChangeRequests.mutate(
      {},
      {
        onSuccess: () => {
          toast.success("Change requests submitted successfully.");
          setSubmitOpen(false);
        },
        onError: () => {
          toast.error("Failed to submit change requests. Please try again.");
        },
      },
    );
  };

  if (isPending) {
    return (
      <div style={{ minHeight: 200, display: "grid", placeItems: "center" }}>
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        style={{
          minHeight: 200,
          display: "grid",
          placeItems: "center",
          color: "var(--color-error)",
          fontSize: "0.85rem",
        }}
      >
        Failed to load change requests.{" "}
        {error?.message && <span>({error.message})</span>}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div>
          <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>
            Change Requests
          </h3>
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--color-text-muted)",
            }}
          >
            All proposed changes for this audit period — journal entries,
            accounts, and invoices.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {draftIds.length > 0 && (
            <>
              <button
                onClick={() => setSubmitOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.45rem 0.85rem",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background: "var(--color-primary-600)",
                  color: "#fff",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <Send size={14} />
                Submit Change Requests
              </button>
              <button
                onClick={() => setDeleteAllOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.45rem 0.85rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-error)",
                  background: "transparent",
                  color: "var(--color-error)",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <Trash2 size={14} />
                Delete All Drafts ({draftIds.length})
              </button>
            </>
          )}
        </div>
      </div>

      <ChangeRequestsList
        changeRequests={changeRequests}
        summary={summary}
        onDeleteDraft={handleDeleteOne}
        isDeleting={deleteDrafts.isPending}
      />

      <ConfirmationModal
        isOpen={deleteAllOpen}
        type="danger"
        title="Delete All Drafts"
        message={`This will permanently delete all ${draftIds.length} draft change request(s). This action cannot be undone.`}
        confirmText="Delete All"
        onConfirm={handleDeleteAll}
        onCancel={() => setDeleteAllOpen(false)}
        disabled={deleteDrafts.isPending}
      />

      <ConfirmationModal
        isOpen={submitOpen}
        type="warning"
        title="Submit Change Requests"
        message="Are you sure you want to submit all draft change requests for review? Once submitted, they can no longer be edited or deleted."
        confirmText="Submit"
        onConfirm={handleSubmit}
        onCancel={() => setSubmitOpen(false)}
        disabled={submitChangeRequests.isPending}
      />
    </div>
  );
};

export default AdjustmentsTab;

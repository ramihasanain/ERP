import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from 'react-i18next';
import { translateApiError } from '@/utils/translateApiError';
import Card from "@/components/Shared/Card";
import Button from "@/components/Shared/Button";
import {
  Plus,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileText,
  X,
  XCircle,
} from "lucide-react";
import Input from "@/components/Shared/Input";
import useCustomQuery from "@/hooks/useQuery";
import { useCustomPost, useCustomRemove } from "@/hooks/useMutation";
import { useForm } from "react-hook-form";
import NoData from "@/core/NoData";
import ResourceLoadError from "@/core/ResourceLoadError";
import Pagination from "@/core/Pagination";
import { formatDateTimeSimple } from "@/utils/formatDateTime";
import { MyRequestsSkeleton } from "@/pages/employee/skeleton";
import { toast } from "sonner";
import ConfirmationModal from "@/components/Shared/ConfirmationModal";

const PAGE_SIZE = 15;

const EMPTY_ROWS = [];

const selectRequestsPayload = (payload) => {
  if (Array.isArray(payload)) {
    return { rows: payload, count: payload.length };
  }
  const rows = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.results)
      ? payload.results
      : EMPTY_ROWS;
  const count =
    typeof payload?.count === "number" ? payload.count : rows.length;
  return { rows, count };
};

const requestTypeLabel = (type, tr) => {
  if (!type) return tr('employee:myRequests.typeRequest');
  const key = String(type).toLowerCase();
  if (key === 'leave') return tr('employee:myRequests.typeLeave');
  if (key === 'document') return tr('employee:myRequests.typeDocument');
  return String(type).charAt(0).toUpperCase() + String(type).slice(1);
};

const buildDetailsLabel = (req) => {
  const raw = req?.details;
  if (raw != null && String(raw).trim() !== "") {
    return String(raw);
  }
  if (req?.dates) return req.dates;
  if (req?.start_date && req?.end_date) {
    return `${req.start_date} – ${req.end_date}`;
  }
  if (req?.start_date) return req.start_date;
  return "—";
};

const resolveDeleteUrl = ({ id, request_type: requestType }) => {
  const t = String(requestType || "").toLowerCase();
  if (t === "document") {
    return `/api/hr/employees/documents/${id}/delete/`;
  }
  return `/api/hr/employees/leaves/${id}/delete/`;
};

const MyRequests = () => {
  const { t } = useTranslation(['employee', 'common']);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [deleteConfirmRequest, setDeleteConfirmRequest] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const requestsUrl = useMemo(() => {
    const queryParams = new URLSearchParams();
    queryParams.set("page", String(currentPage));
    queryParams.set("page_size", String(PAGE_SIZE));
    return `/api/hr/employees/me/requests/?${queryParams.toString()}`;
  }, [currentPage]);

  const requestsQuery = useCustomQuery(
    requestsUrl,
    ["employee-my-requests", currentPage],
    { select: selectRequestsPayload },
  );

  const deleteRequestMutation = useCustomRemove(resolveDeleteUrl, [
    ["employee-my-requests"],
  ]);

  const createLeaveMutation = useCustomPost(
    "/api/hr/employees/leaves/create/",
    [["employee-my-requests"], ["hr-employee-dashboard"]],
  );
  const uploadDocumentMutation = useCustomPost(
    "/api/hr/employees/documents/upload/",
    [["employee-my-requests"], ["hr-employee-dashboard"]],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      request_kind: "leave",
      leave_type: "annual",
      start_date: "",
      end_date: "",
      notes: "",
      document_name: "",
      document_file: null,
    },
  });

  useEffect(() => {
    if (!showRequestModal) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [showRequestModal]);

  const requestKind = watch("request_kind");
  const selectedDocumentFile = watch("document_file")?.[0] || null;
  const leaveStartDate = watch("start_date");
  const leaveEndDate = watch("end_date");
  const computedLeaveDays = useMemo(() => {
    if (requestKind !== "leave") return 0;
    if (!leaveStartDate || !leaveEndDate) return 0;
    const start = new Date(leaveStartDate);
    const end = new Date(leaveEndDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return 0;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  }, [leaveEndDate, leaveStartDate, requestKind]);

  const onSubmitRequest = async (values) => {
    try {
      if (values.request_kind === "document") {
        const file = values.document_file?.[0] || null;
        const formData = new FormData();
        formData.append("name", values.document_name || "");
        if (file) formData.append("file", file);

        await uploadDocumentMutation.mutateAsync(formData);
        toast.success(t('employee:toast.documentUploaded'));
      } else {
        const payload = {
          leave_type: values.leave_type,
          start_date: values.start_date,
          end_date: values.end_date,
          days: computedLeaveDays,
          notes: values.notes || "",
        };

        await createLeaveMutation.mutateAsync(payload);
        toast.success(t('employee:toast.leaveSubmitted'));
      }

      setShowRequestModal(false);
      reset();
    } catch (error) {
      const data = error?.response?.data;
      const fallback =
        (typeof data?.detail === "string" ? data.detail : null) ||
        error?.message ||
        (values.request_kind === "document"
          ? t('employee:toast.uploadDocumentFailed')
          : t('employee:toast.submitLeaveFailed'));

      const renderErrorDescription = (payload) => {
        if (!payload) return null;
        if (typeof payload === "string") return <div>{payload}</div>;
        if (Array.isArray(payload)) {
          const lines = payload
            .map((item) =>
              typeof item === "string" ? item : JSON.stringify(item),
            )
            .filter(Boolean);
          if (lines.length === 0) return null;
          return (
            <div
              className="flex flex-col gap-1.5 text-start"
              style={{ fontSize: "0.8125rem", lineHeight: 1.45 }}
            >
              {lines.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          );
        }

        if (typeof payload === "object") {
          const entries = Object.entries(payload).filter(
            ([, value]) => value != null,
          );
          if (entries.length === 0) return null;

          return (
            <div
              className="flex flex-col gap-2 text-start"
              style={{ fontSize: "0.8125rem", lineHeight: 1.45 }}
            >
              {entries.map(([key, value]) => {
                const items = Array.isArray(value)
                  ? value
                  : typeof value === "string"
                    ? [value]
                    : [JSON.stringify(value)];
                const cleaned = items
                  .map((item) => String(item))
                  .filter((item) => item.trim());
                if (cleaned.length === 0) return null;

                return (
                  <div key={key} className="flex flex-col gap-1">
                    <div
                      style={{
                        fontWeight: 650,
                        color: "var(--color-text-main)",
                      }}
                    >
                      {key.replace(/_/g, " ")}
                    </div>
                    <div
                      className="flex flex-col gap-1"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {cleaned.map((item, idx) => (
                        <div key={`${key}-${idx}`}>- {item}</div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }

        return null;
      };

      const description = renderErrorDescription(data);
      if (description) {
        toast.error(
          values.request_kind === "document"
            ? t('employee:toast.documentUploadFailed')
            : t('employee:toast.leaveRequestFailed'),
          {
            description,
          },
        );
      } else {
        toast.error(fallback);
      }
    }
  };

  const requests = requestsQuery.data?.rows ?? EMPTY_ROWS;
  const totalCount = requestsQuery.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const handleViewDocument = (req) => {
    setSelectedRequest(req);
    setShowDocumentModal(true);
  };

  const handleDownloadDocument = (url) => {
    if (!url) {
      toast.error(t('employee:myRequests.documentUnavailable'));
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const confirmDeleteRequest = async () => {
    const req = deleteConfirmRequest;
    if (!req?.id) return;
    try {
      await deleteRequestMutation.mutateAsync({
        id: req.id,
        request_type: req.request_type,
      });
      toast.success(t('employee:myRequests.requestRemoved'));
      setDeleteConfirmRequest(null);
    } catch (e) {
      toast.error(
        translateApiError(e, 'employee:myRequests.removeFailed'),
      );
    }
  };

  const deleteModalMessage = useMemo(() => {
    if (!deleteConfirmRequest) return "";
    const kind = requestTypeLabel(deleteConfirmRequest.request_type, t);
    const det = buildDetailsLabel(deleteConfirmRequest);
    let snippet = "";
    if (det && det !== "—") {
      const short = det.length > 120 ? `${det.slice(0, 120)}…` : det;
      snippet = `\n\n“${short}”`;
    }
    return t('employee:myRequests.removeRequestConfirm', { kind, snippet });
  }, [deleteConfirmRequest, t]);

  if (requestsQuery.isLoading && !requestsQuery.data) {
    return <MyRequestsSkeleton />;
  }

  if (requestsQuery.isError) {
    return (
      <ResourceLoadError
        error={requestsQuery.error}
        title={t('employee:myRequests.loadError')}
        onRefresh={() => requestsQuery.refetch()}
        refreshLabel="Try again"
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700 }}>{t('employee:myRequests.title')}</h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            {t('employee:myRequests.subtitle')}
          </p>
        </div>
        <Button
          icon={<Plus size={18} />}
          onClick={() => setShowRequestModal(true)}
        >
          New Request
        </Button>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <Card className="padding-lg" style={{ width: "400px" }}>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                marginBottom: "1.5rem",
              }}
            >
              {requestKind === 'document' ? t('employee:requestForm.uploadDocument') : t('employee:requestForm.requestLeave')}
            </h3>
            <form
              onSubmit={handleSubmit(onSubmitRequest)}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                  Request
                </label>
                <select
                  {...register("request_kind")}
                  style={{
                    height: "2.5rem",
                    padding: "0 0.75rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <option value="leave">{t('employee:requestForm.leave')}</option>
                  <option value="document">{t('employee:requestForm.document')}</option>
                </select>
              </div>

              {requestKind === "document" ? (
                <>
                  <Input
                    label={t('employee:requestForm.name')}
                    placeholder={t('employee:requestForm.namePlaceholder')}
                    error={errors.document_name?.message}
                    {...register("document_name", {
                      required: t('employee:requestForm.validation.documentNameRequired'),
                    })}
                  />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                      File
                    </label>
                    <label
                      htmlFor="my-requests-document-file"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.85rem 0.9rem",
                        borderRadius: "var(--radius-md)",
                        border: `1px dashed ${errors.document_file ? "var(--color-error)" : "var(--color-border)"}`,
                        background: "var(--color-bg-surface)",
                        cursor: "pointer",
                        transition:
                          "border-color 120ms ease, background 120ms ease",
                      }}
                    >
                      <span
                        style={{
                          width: 36,
                          height: 36,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "10px",
                          background: "var(--color-primary-50)",
                          color: "var(--color-primary-600)",
                          flex: "0 0 auto",
                        }}
                      >
                        <FileText size={18} />
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 650,
                            fontSize: "0.9rem",
                            color: "var(--color-text-main)",
                          }}
                        >
                          {selectedDocumentFile
                            ? t('employee:requestForm.fileSelected')
                            : t('employee:requestForm.chooseFile')}
                        </div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--color-text-secondary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {selectedDocumentFile
                            ? selectedDocumentFile.name
                            : t('employee:requestForm.fileHint')}
                        </div>
                      </span>
                      {selectedDocumentFile ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setValue("document_file", null, {
                              shouldValidate: true,
                            });
                          }}
                          style={{
                            border: "1px solid var(--color-border)",
                            background: "var(--color-bg-surface)",
                            color: "var(--color-text-secondary)",
                            padding: "0.4rem 0.6rem",
                            borderRadius: "10px",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      ) : (
                        <span
                          style={{
                            border: "1px solid var(--color-border)",
                            background: "var(--color-bg-surface)",
                            color: "var(--color-text-secondary)",
                            padding: "0.4rem 0.6rem",
                            borderRadius: "10px",
                            fontSize: "0.8rem",
                          }}
                        >
                          Browse
                        </span>
                      )}
                    </label>
                    <input
                      id="my-requests-document-file"
                      type="file"
                      accept=".pdf,image/*"
                      style={{ display: "none" }}
                      {...register("document_file", {
                        required: t('employee:requestForm.validation.fileRequired'),
                      })}
                    />
                    {errors.document_file?.message && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-error)",
                        }}
                      >
                        {errors.document_file.message}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                      Leave Type
                    </label>
                    <select
                      {...register("leave_type", {
                        required: t('employee:requestForm.validation.leaveTypeRequired'),
                      })}
                      style={{
                        height: "2.5rem",
                        padding: "0 0.75rem",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <option value="annual">{t('employee:requestForm.annualLeave')}</option>
                      <option value="sick">{t('employee:requestForm.sickLeave')}</option>
                    </select>
                    {errors.leave_type?.message && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-error)",
                        }}
                      >
                        {errors.leave_type.message}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1rem",
                    }}
                  >
                    <Input
                      label={t('employee:requestForm.fromDate')}
                      type="date"
                      error={errors.start_date?.message}
                      {...register("start_date", {
                        required: t('employee:requestForm.validation.startDateRequired'),
                      })}
                    />
                    <Input
                      label={t('employee:requestForm.toDate')}
                      type="date"
                      error={errors.end_date?.message}
                      {...register("end_date", {
                        required: t('employee:requestForm.validation.endDateRequired'),
                        validate: (value) => {
                          if (!leaveStartDate || !value) return true;
                          return (
                            value >= leaveStartDate ||
                            t('employee:requestForm.validation.endDateAfterStart')
                          );
                        },
                      })}
                    />
                  </div>
                  <Input
                    label={t('employee:requestForm.days')}
                    type="number"
                    value={computedLeaveDays}
                    readOnly
                  />
                  <Input
                    label={t('employee:requestForm.notes')}
                    placeholder={t('employee:requestForm.notesPlaceholder')}
                    {...register("notes")}
                  />
                </>
              )}
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  marginTop: "1rem",
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowRequestModal(false);
                    reset();
                  }}
                  type="button"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    (requestKind === "leave" && computedLeaveDays <= 0)
                  }
                >
                  {isSubmitting
                    ? t('employee:requestForm.submitting')
                    : requestKind === "document"
                      ? t('employee:requestForm.uploadDocument')
                      : t('employee:requestForm.submitLeave')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Document preview (backend `document_url`) */}
      {showDocumentModal && selectedRequest && (
        <div
          role="presentation"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            backdropFilter: "blur(4px)",
            padding: "1rem",
          }}
          onClick={() => setShowDocumentModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="document-preview-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(900px, 100%)",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <Card
              className="padding-lg"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                maxHeight: "90vh",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <h3
                  id="document-preview-title"
                  style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}
                >
                  Document
                </h3>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={<Download size={16} />}
                    disabled={!selectedRequest.document_url}
                    onClick={() =>
                      handleDownloadDocument(selectedRequest.document_url)
                    }
                  >
                    Download
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={<X size={20} />}
                    aria-label={t('common:actions.close')}
                    onClick={() => setShowDocumentModal(false)}
                  />
                </div>
              </div>
              {selectedRequest.document_url ? (
                <iframe
                  title={t('employee:myRequests.documentPreview')}
                  src={selectedRequest.document_url}
                  style={{
                    width: "100%",
                    flex: 1,
                    minHeight: "min(70vh, 640px)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-surface)",
                  }}
                />
              ) : (
                <p
                  style={{
                    margin: 0,
                    color: "var(--color-text-secondary)",
                    fontSize: "0.9rem",
                  }}
                >
                  {t('employee:myRequests.noDocumentLinked')}
                </p>
              )}
            </Card>
          </div>
        </div>
      )}

      <Card className="padding-none">
        {requestsQuery.isFetching && (
          <div
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.8rem",
              color: "var(--color-text-muted)",
            }}
          >
            Updating…
          </div>
        )}
        {requests.length === 0 ? (
          <div style={{ padding: "1.25rem" }}>
            <NoData label="requests" />
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.9rem",
            }}
          >
            <thead>
              <tr
                style={{
                  textAlign: "left",
                  background: "var(--color-bg-table-header)",
                  borderBottom: "1px solid var(--color-border)",
                  color: "var(--color-text-secondary)",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                }}
              >
                <th style={{ padding: "1rem 1.5rem" }}>Type</th>
                <th style={{ padding: "1rem 1rem" }}>{t('employee:myRequests.tableDateRequested')}</th>
                <th style={{ padding: "1rem 1rem" }}>{t('employee:myRequests.tableDetails')}</th>
                <th style={{ padding: "1rem 1.5rem" }}>Status</th>
                <th style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => {
                const typeLabel = requestTypeLabel(
                  req.request_type || req.type || req.leave_type,
                  t,
                );
                const rawDate =
                  req.date || req.requested_at || req.created_at || null;
                const dateLabel = formatDateTimeSimple(rawDate) || "—";
                const detailsLabel = buildDetailsLabel(req);
                const statusCode = String(req.status || "").toLowerCase();
                const statusLabel = req.status_display || req.status || "—";
                const isPending = statusCode === "pending";
                const isApproved = statusCode === "approved";
                const isRejected =
                  statusCode === "rejected" ||
                  statusCode === "declined" ||
                  statusCode === "denied";
                const requestKind = String(
                  req.request_type || "",
                ).toLowerCase();
                const documentUrl = req.document_url;

                const statusIcon = isApproved ? (
                  <CheckCircle size={14} />
                ) : isRejected ? (
                  <XCircle size={14} />
                ) : (
                  <Clock size={14} />
                );

                let actionsCell = null;
                if (requestKind === "document") {
                  actionsCell = (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                        alignItems: "center",
                      }}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        icon={<Eye size={14} />}
                        disabled={!documentUrl}
                        onClick={() => handleViewDocument(req)}
                        style={{
                          padding: "0.25rem 0.5rem",
                          fontSize: "0.75rem",
                        }}
                      >
                        View
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon={<Download size={14} />}
                        disabled={!documentUrl}
                        onClick={() => handleDownloadDocument(documentUrl)}
                        style={{
                          padding: "0.25rem 0.5rem",
                          fontSize: "0.75rem",
                        }}
                      >
                        PDF
                      </Button>
                      {isPending && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          isLoading={deleteRequestMutation.isPending}
                          onClick={() => setDeleteConfirmRequest(req)}
                          style={{
                            padding: "0.25rem 0.65rem",
                            fontSize: "0.75rem",
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  );
                } else if (isPending) {
                  actionsCell = (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      isLoading={deleteRequestMutation.isPending}
                      onClick={() => setDeleteConfirmRequest(req)}
                      style={{
                        padding: "0.25rem 0.65rem",
                        fontSize: "0.75rem",
                      }}
                    >
                      Delete
                    </Button>
                  );
                } else if (requestKind === "leave") {
                  if (isApproved) {
                    actionsCell = (
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--color-text-secondary)",
                          lineHeight: 1.4,
                          maxWidth: "220px",
                          display: "inline-block",
                          textAlign: "right",
                        }}
                      >
                        {t('employee:myRequests.leaveApprovedHint')}
                      </span>
                    );
                  } else if (isRejected) {
                    actionsCell = (
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--color-text-secondary)",
                          lineHeight: 1.4,
                          maxWidth: "220px",
                          display: "inline-block",
                          textAlign: "right",
                        }}
                      >
                        {t('employee:myRequests.leaveRejectedHint')}
                      </span>
                    );
                  }
                }

                return (
                  <tr
                    key={req.id || `${typeLabel}-${dateLabel}`}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <td style={{ padding: "1rem 1.5rem", fontWeight: 500 }}>
                      {typeLabel}
                    </td>
                    <td
                      style={{
                        padding: "1rem 1rem",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {dateLabel}
                    </td>
                    <td style={{ padding: "1rem 1rem" }}>{detailsLabel}</td>
                    <td style={{ padding: "1rem 1.5rem" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "1rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          background: isApproved
                            ? "var(--color-success-dim)"
                            : isRejected
                              ? "var(--color-error-dim)"
                              : "var(--color-warning-dim)",
                          color: isApproved
                            ? "var(--color-success)"
                            : isRejected
                              ? "var(--color-error)"
                              : "var(--color-warning)",
                        }}
                      >
                        {statusIcon} {statusLabel}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "1rem 1.5rem",
                        textAlign: "right",
                        verticalAlign: "middle",
                      }}
                    >
                      {actionsCell}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {totalCount > PAGE_SIZE && (
          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <Pagination
              currentPage={safePage}
              count={totalCount}
              onPageChange={setCurrentPage}
              pageSize={PAGE_SIZE}
            />
          </div>
        )}
      </Card>

      <ConfirmationModal
        isOpen={Boolean(deleteConfirmRequest)}
        type="danger"
        title={t('employee:myRequests.removeRequestTitle')}
        message={deleteModalMessage}
        confirmText={deleteRequestMutation.isPending ? t('employee:myRequests.removing') : t('common:actions.delete')}
        cancelText="Cancel"
        onCancel={() =>
          !deleteRequestMutation.isPending && setDeleteConfirmRequest(null)
        }
        onConfirm={confirmDeleteRequest}
      />
    </div>
  );
};

export default MyRequests;

import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from 'react-i18next';
import { translateApiError } from '@/utils/translateApiError';
import Card from "@/components/Shared/Card";
import Button from "@/components/Shared/Button";
import Input from "@/components/Shared/Input";
import {
  Calendar,
  FileText,
  Clock,
  Plus,
  CheckCircle,
  Play,
  Square,
  Timer,
  FolderOpen,
} from "lucide-react";
import NoData from "@/core/NoData";
import ResourceLoadError from "@/core/ResourceLoadError";
import SelectWithLoadMore from "@/core/SelectWithLoadMore";
import useCustomQuery from "@/hooks/useQuery";
import { useMyProjectAssignmentsInfiniteQuery } from "@/hooks/useMyProjectAssignmentsInfiniteQuery";
import { useForm } from "react-hook-form";
import { useCustomPost } from "@/hooks/useMutation";
import { toast } from "sonner";
import formatDate from "@/utils/formatDate";
import { formatDateTimeSimple } from "@/utils/formatDateTime";
import { useTimeTrackerStore } from "@/store/timeTrackerStore";
import { EmployeeDashboardSkeleton } from "@/pages/employee/skeleton";

function extractTimeTrackerStartPayload(data) {
  if (!data || typeof data !== "object")
    return { lineId: null, startTime: null };
  const nested = data.data && typeof data.data === "object" ? data.data : data;
  const lineId = nested.line_id ?? nested.lineId ?? nested.id ?? null;
  const startTime =
    nested.started_at ?? nested.start_time ?? nested.startTime ?? null;
  return {
    lineId: lineId != null && lineId !== "" ? String(lineId) : null,
    startTime,
  };
}

const EmployeeDashboard = () => {
  const { t } = useTranslation(['employee', 'common']);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Timer state
  const [selectedProject, setSelectedProject] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const activeActivity = useTimeTrackerStore((s) => s.activeActivity);
  const start = useTimeTrackerStore((s) => s.start);
  const stop = useTimeTrackerStore((s) => s.stop);
  const syncFromTodayPayload = useTimeTrackerStore(
    (s) => s.syncFromTodayPayload,
  );
  const dashboardQuery = useCustomQuery("/api/hr/employees/dashboard/", [
    "hr-employee-dashboard",
  ]);
  const todayTrackerQuery = useCustomQuery("/api/hr/time-trackers/today/", [
    "hr-time-trackers-today",
  ]);
  const assignmentsQuery = useMyProjectAssignmentsInfiniteQuery();

  const createLeaveMutation = useCustomPost(
    "/api/hr/employees/leaves/create/",
    [["hr-employee-dashboard"]],
  );
  const uploadDocumentMutation = useCustomPost(
    "/api/hr/employees/documents/upload/",
    [["hr-employee-dashboard"]],
  );
  const startTimeTrackerMutation = useCustomPost(
    "/api/hr/time-trackers/start/",
    [["hr-employee-dashboard"], ["hr-time-trackers-today"]],
  );
  const stopTimeTrackerMutation = useCustomPost("/api/hr/time-trackers/stop/", [
    ["hr-employee-dashboard"],
    ["hr-time-trackers-today"],
  ]);
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

  const dashboardData = dashboardQuery.data ?? {};
  const apiProjects = useMemo(
    () =>
      Array.isArray(dashboardData?.my_projects)
        ? dashboardData.my_projects
        : [],
    [dashboardData?.my_projects],
  );
  const myProjects = apiProjects;
  const assignmentProjects = useMemo(() => {
    const pages = assignmentsQuery.data?.pages ?? [];
    return pages.flatMap((page) =>
      Array.isArray(page?.data) ? page.data : [],
    );
  }, [assignmentsQuery.data]);
  const projectSelectOptions = useMemo(
    () =>
      assignmentProjects.map((p) => ({
        value: String(p.id),
        label: p.name || t('employee:dashboard.untitledProject'),
      })),
    [assignmentProjects],
  );
  const completedTodayLines = useMemo(() => {
    const lines = Array.isArray(todayTrackerQuery.data?.lines)
      ? todayTrackerQuery.data.lines
      : [];
    return lines
      .filter((line) => String(line?.status ?? "").toLowerCase() !== "running")
      .slice()
      .sort((a, b) => {
        const ta = new Date(a?.started_at ?? 0).getTime();
        const tb = new Date(b?.started_at ?? 0).getTime();
        return tb - ta;
      });
  }, [todayTrackerQuery.data]);
  const myRequests = Array.isArray(dashboardData?.my_requests)
    ? dashboardData.my_requests
    : [];
  const upcomingHolidays = Array.isArray(dashboardData?.upcoming_holidays)
    ? dashboardData.upcoming_holidays
    : [];
  const pendingRequestsCount = Number(
    dashboardData?.pending_requests_count ?? 0,
  );
  const leaveBalance = dashboardData?.leave_balance ?? {};
  const latestPayslip = dashboardData?.latest_payslip ?? null;
  const greetingName = dashboardData?.user?.full_name || t('employee:employee');

  // Live ticker
  useEffect(() => {
    let interval;
    if (activeActivity?.status === "running") {
      interval = setInterval(() => {
        setElapsedTime(
          Math.round(
            (Date.now() - new Date(activeActivity.startTime).getTime()) / 1000,
          ),
        );
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [activeActivity?.startTime, activeActivity?.status]);

  useEffect(() => {
    if (!todayTrackerQuery.data) return;
    syncFromTodayPayload(todayTrackerQuery.data);
  }, [todayTrackerQuery.data, syncFromTodayPayload]);

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleStart = async () => {
    if (!selectedProject || startTimeTrackerMutation.isPending) return;
    try {
      const body = {
        note: taskDescription || "",
        project_id: selectedProject,
      };
      const res = await startTimeTrackerMutation.mutateAsync(body);
      const { lineId, startTime: serverStart } =
        extractTimeTrackerStartPayload(res);
      start({
        projectId: selectedProject,
        description: taskDescription,
        lineId,
        startTime: serverStart,
      });
      setTaskDescription("");
      toast.success(t('employee:toast.timeTrackerStarted'));
    } catch (error) {
      toast.error(t('employee:toast.timeTrackerStartFailed'), {
        description: translateApiError(error),
      });
    }
  };

  const handleStop = async () => {
    if (
      activeActivity?.status !== "running" ||
      stopTimeTrackerMutation.isPending
    )
      return;
    const lineId = activeActivity.lineId ?? activeActivity.id;
    if (!lineId) {
      stop();
      toast.success(t('employee:toast.timeTrackerStopped'));
      return;
    }
    try {
      await stopTimeTrackerMutation.mutateAsync({ line_id: lineId });
      stop();
      toast.success(t('employee:toast.timeTrackerStopped'));
    } catch (error) {
      toast.error(t('employee:toast.timeTrackerStopFailed'), {
        description: translateApiError(error),
      });
    }
  };

  const getProjectName = (projectId) => {
    const key = String(projectId);
    const fromAssignments = assignmentProjects.find(
      (p) => String(p.id) === key,
    );
    const fromDashboard = myProjects.find((p) => String(p.id) === key);
    return fromAssignments?.name ?? fromDashboard?.name ?? projectId;
  };

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

  const formatCurrency = (amount, currency = "USD") => {
    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount)) return "-";
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parsedAmount);
  };

  const annualEntitlement = Number(leaveBalance?.annual_entitlement ?? 0);
  const remainingBalance = Number(leaveBalance?.remaining_balance ?? 0);
  const leaveUsed = Math.max(annualEntitlement - remainingBalance, 0);
  const leaveUsagePercentage =
    annualEntitlement > 0
      ? Math.min((leaveUsed / annualEntitlement) * 100, 100)
      : 0;

  if (dashboardQuery.isLoading && !dashboardQuery.data) {
    return <EmployeeDashboardSkeleton />;
  }

  if (dashboardQuery.isError) {
    return (
      <ResourceLoadError
        error={dashboardQuery.error}
        title={t('employee:dashboard.loadError')}
        onRefresh={() => dashboardQuery.refetch()}
        refreshLabel={t('common:actions.retry')}
      />
    );
  }

  const isEmptyDashboard =
    dashboardQuery.isSuccess &&
    (!dashboardQuery.data || Object.keys(dashboardQuery.data).length === 0);

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
          <h1
            style={{ fontSize: "1.75rem", fontWeight: 700 }}
          >{t('employee:dashboard.greeting', { name: greetingName })}</h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            {t(`employee:dashboard.pendingRequests${pendingRequestsCount === 1 ? '_one' : '_other'}`, { count: pendingRequestsCount })}
          </p>
        </div>
        <Button
          icon={<Plus size={18} />}
          onClick={() => setShowRequestModal(true)}
        >
          New Request
        </Button>
      </div>

      {isEmptyDashboard && <NoData label={t('employee:empty.dashboard')} />}

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
                      htmlFor="employee-dashboard-document-file"
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
                      id="employee-dashboard-document-file"
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

      {/* ── TIME TRACKER WIDGET ── */}
      <Card
        className="padding-lg"
        style={{
          border:
            activeActivity?.status === "running"
              ? "2px solid var(--color-success)"
              : "1px solid var(--color-border)",
          background:
            activeActivity?.status === "running"
              ? "linear-gradient(to right, #f0fdf4, white)"
              : undefined,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1.25rem",
          }}
        >
          <div
            style={{
              padding: "0.5rem",
              borderRadius: "var(--radius-md)",
              background:
                activeActivity?.status === "running"
                  ? "var(--color-success)"
                  : "var(--color-primary-50)",
              color:
                activeActivity?.status === "running"
                  ? "white"
                  : "var(--color-primary-600)",
            }}
          >
            <Timer size={20} />
          </div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>{t('employee:dashboard.timeTracker')}</h3>
          {activeActivity?.status === "running" && (
            <span
              style={{
                marginLeft: "auto",
                fontSize: "2rem",
                fontWeight: 700,
                fontFamily: "monospace",
                color: "var(--color-success)",
                letterSpacing: "2px",
              }}
            >
              {formatDuration(elapsedTime)}
            </span>
          )}
        </div>

        {activeActivity?.status === "running" ? (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1rem",
                background: "var(--color-slate-50)",
                borderRadius: "10px",
                marginBottom: "1rem",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                  {getProjectName(activeActivity.projectId)}
                </div>
                {activeActivity.description && (
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--color-text-secondary)",
                      marginTop: "0.25rem",
                    }}
                  >
                    {activeActivity.description}
                  </div>
                )}
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                    marginTop: "0.25rem",
                  }}
                >
                  {t('employee:dashboard.startedAt', { time: formatDateTimeSimple(activeActivity.startTime) || '—' })}
                  {formatDateTimeSimple(activeActivity.startTime) || "—"}
                </div>
              </div>
              <Button
                variant="outline"
                style={{
                  color: "var(--color-error)",
                  borderColor: "var(--color-error)",
                  gap: "0.5rem",
                }}
                onClick={handleStop}
                disabled={stopTimeTrackerMutation.isPending}
              >
                <Square size={16} fill="var(--color-error)" />{" "}
                {stopTimeTrackerMutation.isPending ? t('employee:dashboard.stopping') : t('employee:dashboard.stop')}
              </Button>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: "1 1 200px", minWidth: 0 }}>
              <SelectWithLoadMore
                id="employee-dashboard-time-tracker-project"
                label={t('employee:dashboard.project')}
                value={selectedProject}
                onChange={setSelectedProject}
                options={projectSelectOptions}
                emptyOptionLabel={t('employee:dashboard.selectProject')}
                hasMore={Boolean(assignmentsQuery.hasNextPage)}
                onLoadMore={() => assignmentsQuery.fetchNextPage()}
                isLoadingMore={assignmentsQuery.isFetchingNextPage}
                isInitialLoading={assignmentsQuery.isPending}
                paginationError={
                  assignmentsQuery.isError
                    ? t('employee:dashboard.projectsLoadError')
                    : null
                }
                zIndex={500}
              />
            </div>
            <div
              style={{
                flex: "1.5 1 260px",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <label
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  color: "var(--color-text-secondary)",
                }}
              >
                {t('employee:dashboard.whatWorkingOn')}
              </label>
              <input
                type="text"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder={t('employee:dashboard.workOnPlaceholder')}
                style={{
                  height: "2.5rem",
                  padding: "0 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid var(--color-border)",
                  fontSize: "0.9rem",
                }}
              />
            </div>
            <Button
              onClick={handleStart}
              disabled={
                !selectedProject ||
                startTimeTrackerMutation.isPending ||
                assignmentsQuery.isPending
              }
              style={{
                gap: "0.5rem",
                height: "2.5rem",
                background: selectedProject
                  ? "var(--color-success)"
                  : "var(--color-slate-300)",
                borderColor: selectedProject
                  ? "var(--color-success)"
                  : "var(--color-slate-300)",
              }}
            >
              <Play size={16} fill="white" />{" "}
              {startTimeTrackerMutation.isPending ? t('employee:dashboard.starting') : t('employee:dashboard.start')}
            </Button>
          </div>
        )}

        {/* Today's completed lines (running entry is shown above) */}
        <div
          style={{
            marginTop: "1.25rem",
            borderTop: "1px solid var(--color-border)",
            paddingTop: "1rem",
          }}
        >
          <div
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--color-text-secondary)",
              marginBottom: "0.5rem",
            }}
          >
            {t('employee:dashboard.todaysActivity')}
          </div>
          {todayTrackerQuery.isLoading && !todayTrackerQuery.data ? (
            <div
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
              }}
            >
              {t('employee:dashboard.loadingTodayLog')}
            </div>
          ) : todayTrackerQuery.isError ? (
            <div style={{ fontSize: "0.8125rem", color: "var(--color-error)" }}>
              {t('employee:dashboard.todayEntriesError')}
              <button
                type="button"
                onClick={() => todayTrackerQuery.refetch()}
                style={{
                  marginLeft: "0.5rem",
                  border: "none",
                  background: "none",
                  color: "var(--color-primary-600)",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          ) : completedTodayLines.length === 0 ? (
            <div
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
              }}
            >
              {t('employee:dashboard.noCompletedToday')}
            </div>
          ) : (
            completedTodayLines.map((line, index) => {
              const projectName =
                line?.project?.name ||
                getProjectName(line?.project?.id ?? line?.project_id ?? "");
              const durationSec = Number(line?.duration_seconds ?? 0);
              const startedLabel =
                formatDateTimeSimple(line?.started_at) || "—";
              return (
                <div
                  key={line.id ?? `line-${index}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem 0",
                    borderBottom:
                      index === completedTodayLines.length - 1
                        ? "none"
                        : "1px solid var(--color-border)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>
                      {projectName}
                    </div>
                    {line.note ? (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {line.note}
                      </div>
                    ) : null}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        fontFamily: "monospace",
                      }}
                    >
                      {formatDuration(
                        Number.isFinite(durationSec) ? durationSec : 0,
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {startedLabel}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.5rem",
        }}
      >
        <Card className="padding-lg">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                padding: "0.5rem",
                background: "var(--color-primary-50)",
                color: "var(--color-primary-600)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <Clock size={20} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>
              Leave Balance
            </h3>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.5rem",
            }}
          >
            <span style={{ color: "var(--color-text-secondary)" }}>
              Annual Leave
            </span>
            <span
              style={{ fontWeight: 700 }}
            >{t('employee:dashboard.daysCount', { remaining: remainingBalance, total: annualEntitlement })}</span>
          </div>
          <div
            style={{
              width: "100%",
              height: "6px",
              background: "var(--color-slate-100)",
              borderRadius: "3px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${100 - leaveUsagePercentage}%`,
                height: "100%",
                background: "var(--color-primary-500)",
              }}
            />
          </div>
        </Card>

        <Card className="padding-lg">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                padding: "0.5rem",
                background: "var(--color-success)",
                color: "white",
                borderRadius: "var(--radius-md)",
              }}
            >
              <FileText size={20} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>{t('employee:dashboard.payslipsCard')}</h3>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            {latestPayslip ? (
              <>
                <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                  {formatCurrency(
                    latestPayslip.amount,
                    latestPayslip.currency || "USD",
                  )}
                </div>
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {t('employee:dashboard.lastPayment', {
                    date: formatDate(latestPayslip.pay_date) || '-',
                    period: latestPayslip.period_name || t('employee:dashboard.period'),
                  })}
                </div>
              </>
            ) : (
              <NoData
                label={t('employee:empty.payslip')}
                size="sm"
                variant="inline"
                style={{
                  padding: "0.75rem 0.25rem",
                }}
              />
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            style={{ width: "100%" }}
            disabled={!latestPayslip}
            onClick={() => toast.info(t('employee:dashboard.payslipDownloadUnavailable'))}
          >
            Download PDF
          </Button>
        </Card>

        <Card className="padding-lg">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                padding: "0.5rem",
                background: "var(--color-warning)",
                color: "white",
                borderRadius: "var(--radius-md)",
              }}
            >
              <Calendar size={20} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>
              Upcoming Holidays
            </h3>
          </div>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {upcomingHolidays.length === 0 ? (
              <li>
                <NoData label={t('employee:empty.upcomingHolidays')} size="sm" />
              </li>
            ) : (
              upcomingHolidays.map((holiday, index) => (
                <li
                  key={holiday.id || `${holiday.name}-${holiday.date}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.5rem 0",
                    borderBottom:
                      index === upcomingHolidays.length - 1
                        ? "none"
                        : "1px solid var(--color-border)",
                  }}
                >
                  <span>{holiday.name || t('employee:dashboard.holiday')}</span>
                  <span style={{ color: "var(--color-text-muted)" }}>
                    {formatDate(holiday.date) || "-"}
                  </span>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      {/* My Projects */}
      <div>
        <h3
          style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}
        >
          My Projects
        </h3>
        {myProjects.length === 0 ? (
          <NoData label={t('employee:empty.projects')} />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {myProjects.map((p) => (
              <Card
                key={p.id || p.name}
                className="padding-md hoverable"
                style={{ cursor: "default" }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: "2.5rem",
                      height: "2.5rem",
                      borderRadius: "10px",
                      background: "var(--color-primary-50)",
                      color: "var(--color-primary-600)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FolderOpen size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                      {p.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {p.client_name || p.client || t('dashboard.internal')}
                      {Array.isArray(p.assignedEmployees)
                        ? ` • ${t('dashboard.members', { count: p.assignedEmployees.length })}`
                        : ""}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3
          style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}
        >
          My Requests
        </h3>
        {myRequests.length === 0 ? (
          <NoData label={t('employee:empty.requests')} />
        ) : (
          <Card className="padding-none">
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
                  <th style={{ padding: "0.75rem 1.5rem" }}>{t('employee:dashboard.tableType')}</th>
                  <th style={{ padding: "0.75rem 1rem" }}>{t('employee:dashboard.tableDates')}</th>
                  <th style={{ padding: "0.75rem 1rem" }}>{t('employee:dashboard.tableDays')}</th>
                  <th style={{ padding: "0.75rem 1.5rem" }}>{t('employee:dashboard.tableStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.map((req) => {
                  const requestStatus = (req.status || "Pending").toString();
                  const statusLower = requestStatus.toLowerCase();
                  const isApproved = statusLower === "approved";
                  const isRejected =
                    statusLower === "rejected" || statusLower === "declined";
                  const statusBg = isApproved
                    ? "var(--color-success-dim)"
                    : isRejected
                      ? "var(--color-error-dim)"
                      : "var(--color-warning-dim)";
                  const statusColor = isApproved
                    ? "var(--color-success)"
                    : isRejected
                      ? "var(--color-error)"
                      : "var(--color-warning)";

                  const requestType =
                    req.type || req.leave_type || req.request_type || "Request";
                  const startDate = req.start || req.start_date || null;
                  const endDate = req.end || req.end_date || null;
                  const requestDays = req.days ?? req.total_days ?? null;
                  return (
                    <tr
                      key={req.id || `${req.type}-${req.created_at}`}
                      style={{ borderBottom: "1px solid var(--color-border)" }}
                    >
                      <td style={{ padding: "1rem 1.5rem", fontWeight: 500 }}>
                        {requestType}
                      </td>
                      <td style={{ padding: "1rem 1rem" }}>
                        {startDate && endDate
                          ? `${formatDate(startDate) || "-"} - ${formatDate(endDate) || "-"}`
                          : startDate
                            ? formatDate(startDate) || "-"
                            : "-"}
                      </td>
                      <td
                        style={{
                          padding: "1rem 1rem",
                          color: "var(--color-text-secondary)",
                          fontWeight: 600,
                        }}
                      >
                        {requestDays != null && requestDays !== ""
                          ? requestDays
                          : "-"}
                      </td>
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
                            background: statusBg,
                            color: statusColor,
                          }}
                        >
                          {isApproved ? (
                            <CheckCircle size={14} />
                          ) : isRejected ? (
                            <Square size={14} />
                          ) : (
                            <Clock size={14} />
                          )}{" "}
                          {requestStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;

import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Plus, RefreshCw, Eye, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Card from "@/components/Shared/Card";
import Button from "@/components/Shared/Button";
import Input from "@/components/Shared/Input";
import Modal from "@/components/Shared/Modal";
import ConfirmationModal from "@/components/Shared/ConfirmationModal";
import ContractTemplatesPreviewView from "@/components/hr/ContractTemplates/ContractTemplatesPreviewView";
import Spinner from "@/core/Spinner";
import SelectWithLoadMore from "@/core/SelectWithLoadMore";
import useCustomQuery from "@/hooks/useQuery";
import { useCurrenciesInfiniteQuery } from "@/hooks/useCurrenciesInfiniteQuery";
import {
  useCustomPost,
  useCustomPut,
  useCustomRemove,
} from "@/hooks/useMutation";
import formatDate from "@/utils/formatDate";

const contractDefaults = {
  contract_type: "full_time",
  start_date: "",
  end_date: "",
  annual_leave_days: "",
  template: "",
  structure: "",
  basic_salary: "",
  currency: "",
  transportation: "",
  housing: "",
  other_allowances: "",
  social_security: "",
  health_insurance: "",
  other_deductions: "",
};

const salaryIncreaseDefaults = {
  effective_date: "",
  new_basic_salary: "",
  reason: "",
};

const evaluationDefaults = {
  review_period_start: "",
  review_period_end: "",
  job_knowledge: 3,
  work_quality: 3,
  attendance: 3,
  communication: 3,
  initiative: 3,
  comments: "",
};

const labelStyle = {
  display: "block",
  marginBottom: "0.5rem",
  fontSize: "0.875rem",
  fontWeight: 500,
};

const selectStyle = {
  width: "100%",
  padding: "0.625rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-bg-surface)",
  color: "var(--color-text-main)",
};

const tableHeaderStyle = {
  textAlign: "left",
  padding: "0.75rem",
  fontWeight: 600,
  fontSize: "0.85rem",
  color: "var(--color-text-secondary)",
  background: "var(--color-bg-table-header)",
  borderBottom: "1px solid var(--color-border)",
};

const tableCellStyle = {
  padding: "0.75rem",
  borderBottom: "1px solid var(--color-border)",
  verticalAlign: "top",
};

const parseArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

/** Stable empty object so dependency comparisons / effects do not treat “no object” as a new value every render. */
const EMPTY_OBJECT = Object.freeze({});

const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value
    : EMPTY_OBJECT;

const normalizeCurrencyCode = (raw) => {
  if (raw == null || raw === "") return "";
  return String(raw).trim().toUpperCase();
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const looksLikeUuid = (raw) =>
  typeof raw === "string" && UUID_RE.test(raw.trim());

const getCurrencyItemId = (item) => {
  if (!item || typeof item !== "object") return "";
  const id = item?.uuid ?? item?.id;
  return id != null && id !== "" ? String(id).trim() : "";
};

/**
 * Normalize `compensation_data.currency` from the API into a currency row id (uuid).
 * Accepts uuid string, nested { id, uuid }, or legacy ISO code when `currencies` is loaded.
 */
const coerceCompensationCurrencyToId = (raw, currencies) => {
  const list = Array.isArray(currencies) ? currencies : [];
  if (raw == null || raw === "") return "";
  if (typeof raw === "object") {
    const id = getCurrencyItemId(raw);
    if (id) return id;
    const nestedCode = normalizeCurrencyCode(raw.code || raw.currency_code);
    if (nestedCode) {
      const hit = list.find(
        (c) => normalizeCurrencyCode(c?.code) === nestedCode,
      );
      if (hit) return getCurrencyItemId(hit);
      if (!list.length) return nestedCode;
    }
    return "";
  }
  const s = String(raw).trim();
  if (!s) return "";
  if (looksLikeUuid(s)) return s;
  const code = normalizeCurrencyCode(s);
  if (!code) return "";
  if (!list.length) return code;
  const hit = list.find((c) => normalizeCurrencyCode(c?.code) === code);
  return hit ? getCurrencyItemId(hit) : "";
};

/** Resolve compensation currency for the contract form (uuid preferred). */
const resolveCompensationCurrencyFormValue = (compRaw, currencies) => {
    const { t } = useTranslation(['hr', 'common']);

  const comp = asObject(compRaw);
  return (
    coerceCompensationCurrencyToId(comp.currency, currencies) ||
    coerceCompensationCurrencyToId(comp.currency_code, currencies) ||
    ""
  );
};

const compensationCurrencyDisplayCode = (comp, currencies) => {
  const list = Array.isArray(currencies) ? currencies : [];
  const fromCode = normalizeCurrencyCode(comp?.currency_code);
  if (fromCode) return fromCode;
  const cur = comp?.currency;
  if (cur && typeof cur === "object") {
    return (
      normalizeCurrencyCode(cur.code || cur.currency_code) ||
      (getCurrencyItemId(cur)
        ? normalizeCurrencyCode(
            list.find((c) => getCurrencyItemId(c) === getCurrencyItemId(cur))
              ?.code,
          )
        : "")
    );
  }
  const s = String(cur ?? "").trim();
  if (!s) return "";
  if (looksLikeUuid(s)) {
    const hit = list.find((c) => getCurrencyItemId(c) === s);
    return normalizeCurrencyCode(hit?.code);
  }
  return normalizeCurrencyCode(s);
};

const rowCurrencyDisplayCode = (rowCurrency, currencies, fallbackCode) => {
  const list = Array.isArray(currencies) ? currencies : [];
  const fb = normalizeCurrencyCode(fallbackCode) || "JOD";
  if (rowCurrency == null || rowCurrency === "") return fb;
  const s = String(rowCurrency).trim();
  if (!s) return fb;
  if (looksLikeUuid(s)) {
    const hit = list.find((c) => getCurrencyItemId(c) === s);
    return normalizeCurrencyCode(hit?.code) || fb;
  }
  return normalizeCurrencyCode(s) || fb;
};

const formatMoney = (value, currency = "JOD") => {
  const number = Number(value || 0);
  return `${number.toFixed(2)} ${currency}`;
};

const formatDateDisplay = (value) => formatDate(value) || "-";

const getTodayIsoDate = () => {

  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/** YYYY-MM-DD for display in copy (avoids timezone shifts on date-only strings). */
const toIsoDateDisplay = (value) => {

  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value.trim())) {
    return value.trim().slice(0, 10);
  }
  try {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  } catch {
    return String(value);
  }
};

const formatSalaryDisplay = (value, currency = "JOD") => {
  const n = Number(value || 0);
  return `${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
};

/** API expects decimal strings e.g. `"1350.00"`. */
const formatApiDecimalAmount = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return "0.00";
  return n.toFixed(2);
};

const getContractPeriodDisplay = (row) => {
  if (typeof row?.period === "string" && row.period.trim()) {
    return row.period;
  }
  const start = row?.start_date || row?.period_start;
  const end = row?.end_date || row?.period_end;
  if (!start && !end) return "-";
  return `${formatDateDisplay(start)} - ${formatDateDisplay(end)}`;
};

const getErrorMessage = (error, fallbackMessage) => {
  const apiData = error?.response?.data;
  if (!apiData) return error?.message || fallbackMessage;

  if (typeof apiData?.detail === "string" && apiData.detail.trim()) {
    return apiData.detail;
  }

  if (
    Array.isArray(apiData?.non_field_errors) &&
    apiData.non_field_errors.length > 0
  ) {
    return apiData.non_field_errors.filter(Boolean).join(", ");
  }

  // Fallback for field-level validation objects: { field: ["msg"] }
  if (typeof apiData === "object") {
    const firstFieldError = Object.values(apiData).find(
      (value) => Array.isArray(value) && value.length > 0,
    );
    if (firstFieldError) return firstFieldError.filter(Boolean).join(", ");
  }

  return error?.message || fallbackMessage;
};

const getRenderedTemplateHtml = (response) => {
  if (typeof response === "string") return response;
  if (typeof response?.data === "string") return response.data;
  if (typeof response?.html === "string") return response.html;
  if (typeof response?.rendered_html === "string")
    return response.rendered_html;
  return "";
};

const getHtmlCopyContent = (html) => {
  if (!html) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const bodyChildren = Array.from(doc.body.children);
  if (
    bodyChildren.length === 1 &&
    bodyChildren[0].tagName.toLowerCase() === "div"
  ) {
    return bodyChildren[0].innerHTML;
  }
  return doc.body.innerHTML || html;
};

const parseStructureComponents = (description) => {

  if (!description || typeof description !== "string") return [];
  return description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, value] = line.split(":");
      return { name: name?.trim() || line, value: value?.trim() || "Variable" };
    });
};

const ContractSalaryTab = ({ employeeId }) => {

  const prevEmployeeIdRef = useRef(employeeId);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [contractMode, setContractMode] = useState("create");
  const [contractToDelete, setContractToDelete] = useState(null);
  const [renderedContractHtml, setRenderedContractHtml] = useState("");
  const [renderedTemplateId, setRenderedTemplateId] = useState("");
  const [isTemplatePreviewOpen, setIsTemplatePreviewOpen] = useState(false);

  const sessionCacheQueryOpts = {
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
  };

  const historyQuery = useCustomQuery(
    `/api/hr/employees/${employeeId}/history/`,
    ["hr-employee-history", employeeId],
    {
      enabled: !!employeeId,
      ...sessionCacheQueryOpts,
    },
  );
  const structuresQuery = useCustomQuery(
    "/api/hr/salary-structures/",
    ["hr-salary-structures"],
    sessionCacheQueryOpts,
  );
  const templatesQuery = useCustomQuery(
    "/api/hr/contract-templates/",
    ["hr-contract-templates"],
    sessionCacheQueryOpts,
  );

  const createContractMutation = useCustomPost(
    `/api/hr/employees/${employeeId}/contract-compensation/`,
    [["hr-employee-history", employeeId]],
  );
  const updateContractMutation = useCustomPut(
    `/api/hr/employees/${employeeId}/contract-compensation/`,
    [["hr-employee-history", employeeId]],
  );
  const deleteContractMutation = useCustomRemove(
    (contractId) =>
      `/api/hr/employees/${employeeId}/history/contracts/${contractId}/delete/`,
    [["hr-employee-history", employeeId]],
  );
  const createSalaryIncreaseMutation = useCustomPost(
    `/api/hr/employees/${employeeId}/salary-increases/`,
    [["hr-employee-history", employeeId]],
  );
  const createEvaluationMutation = useCustomPost(
    `/api/hr/employees/${employeeId}/evaluations/`,
    [["hr-employee-history", employeeId]],
  );
  const renderTemplateMutation = useCustomPost(
    ({ templateId }) =>
      `/api/hr/contract-templates/${templateId}/render/?output=html`,
  );

  const contractForm = useForm({ defaultValues: contractDefaults });
  const salaryIncreaseForm = useForm({ defaultValues: salaryIncreaseDefaults });
  const evaluationForm = useForm({ defaultValues: evaluationDefaults });

  const isLoading =
    historyQuery.isLoading ||
    structuresQuery.isLoading ||
    templatesQuery.isLoading;
  const hasError =
    historyQuery.isError || structuresQuery.isError || templatesQuery.isError;

  const historyData = historyQuery.data || {};
  const currentContract = asObject(
    historyData?.contract_details ?? historyData?.contract_data,
  );
  const currentCompensation = asObject(
    historyData?.current_compensation ?? historyData?.compensation_data,
  );
  const templates = parseArray(templatesQuery.data);
  const structures = parseArray(structuresQuery.data);
  const selectedTemplateId = contractForm.watch("template");
  const selectedTemplate = useMemo(
    () =>
      templates.find(
        (template) => (template?.id || template?.uuid) === selectedTemplateId,
      ) || null,
    [selectedTemplateId, templates],
  );
  const hasGeneratedSelectedTemplate =
    Boolean(renderedContractHtml) && renderedTemplateId === selectedTemplateId;

  const hasCurrentContract =
    Object.keys(currentContract).length > 0 ||
    Object.keys(currentCompensation).length > 0;

  const structureFieldId = contractForm.watch("structure");
  const watchedCurrency = contractForm.watch("currency");
  const selectedStructure = useMemo(
    () =>
      structures.find(
        (item) => (item?.id || item?.uuid) === structureFieldId,
      ) || null,
    [structureFieldId, structures],
  );

  const structureComponents = useMemo(
    () => parseStructureComponents(selectedStructure?.description),
    [selectedStructure],
  );

  const currenciesQuery = useCurrenciesInfiniteQuery();
  const currencies = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const page of currenciesQuery.data?.pages ?? []) {
      const list = page?.data?.results ?? page?.data ?? page?.results ?? page;
      if (!Array.isArray(list)) continue;
      for (const item of list) {
        const id = getCurrencyItemId(item);
        const code = normalizeCurrencyCode(item?.code);
        if (!id || !code || seen.has(id)) continue;
        seen.add(id);
        out.push(item);
      }
    }
    return out;
  }, [currenciesQuery.data]);

  const currencySelectOptions = useMemo(() => {
    const base = currencies
      .map((c) => {
        const id = getCurrencyItemId(c);
        const code = normalizeCurrencyCode(c?.code);
        if (!id || !code) return null;
        const name = (c?.name && String(c.name).trim()) || "";
        const label = name ? `${code} - ${name}` : code;
        return { value: id, label };
      })
      .filter(Boolean);

    const currentId = String(watchedCurrency ?? "").trim();
    if (currentId && !base.some((o) => o.value === currentId)) {
      return [
        {
          value: currentId,
          label: looksLikeUuid(currentId)
            ? `${currentId.slice(0, 8)}…`
            : currentId,
        },
        ...base,
      ];
    }
    return base;
  }, [currencies, watchedCurrency]);

  const {
    isLoading: currenciesInitialLoading,
    hasNextPage: currenciesHasNextPage,
    fetchNextPage: fetchNextCurrenciesPage,
    isFetchingNextPage: isFetchingNextCurrenciesPage,
    isFetchNextPageError: isFetchNextCurrenciesPageError,
    isError: currenciesFailed,
  } = currenciesQuery;

  /** Map legacy code in the form to currency uuid once the list loads; fill default when empty. */
  useEffect(() => {
    if (!currencies.length) return;
    const cur = String(contractForm.getValues("currency") ?? "").trim();

    if (cur && !looksLikeUuid(cur)) {
      const hit = currencies.find(
        (c) => normalizeCurrencyCode(c?.code) === normalizeCurrencyCode(cur),
      );
      if (hit) {
        contractForm.setValue("currency", getCurrencyItemId(hit), {
          shouldDirty: false,
        });
      }
      return;
    }

    if (cur) return;

    const compRaw = asObject(
      historyQuery.data?.current_compensation ??
        historyQuery.data?.compensation_data,
    );
    const resolved = resolveCompensationCurrencyFormValue(
      compRaw,
      currencies,
    );
    if (resolved) {
      contractForm.setValue("currency", resolved, { shouldDirty: false });
      return;
    }
    const pick =
      currencies.find((c) => Boolean(c?.is_default)) || currencies[0];
    const id = pick ? getCurrencyItemId(pick) : "";
    if (id) {
      contractForm.setValue("currency", id, { shouldDirty: false });
    }
  }, [currencies, employeeId, historyQuery.data, contractForm]);

  useEffect(() => {
    if (!employeeId) return;
    if (prevEmployeeIdRef.current === employeeId) return;
    prevEmployeeIdRef.current = employeeId;
    contractForm.reset(contractDefaults);
    salaryIncreaseForm.reset(salaryIncreaseDefaults);
    evaluationForm.reset(evaluationDefaults);
    setContractMode("create");
    setRenderedContractHtml("");
    setRenderedTemplateId("");
    setIsTemplatePreviewOpen(false);
    setIsSalaryModalOpen(false);
    setIsEvaluationModalOpen(false);
    // Only when switching employees — RHF form identities are intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  useEffect(() => {
    setRenderedContractHtml("");
    setRenderedTemplateId("");
    setIsTemplatePreviewOpen(false);
  }, [selectedTemplateId]);

  useEffect(() => {
    if (!employeeId) return;
    const data = historyQuery.data;
    if (data == null) return;

    const contractRaw = asObject(data.contract_details ?? data.contract_data);
    const compRaw = asObject(
      data.current_compensation ?? data.compensation_data,
    );
    const hasData =
      Object.keys(contractRaw).length > 0 || Object.keys(compRaw).length > 0;

    if (!hasData) {
      setContractMode("create");
      return;
    }

    const resolvedCurrency = resolveCompensationCurrencyFormValue(
      compRaw,
      currencies,
    );
    const currentCurrency = String(
      contractForm.getValues("currency") ?? "",
    ).trim();
    const currencyValue =
      resolvedCurrency ||
      (currentCurrency && looksLikeUuid(currentCurrency)
        ? currentCurrency
        : "");

    contractForm.reset({
      contract_type: contractRaw.contract_type || "full_time",
      start_date: contractRaw.start_date || "",
      end_date: contractRaw.end_date || "",
      annual_leave_days:
        contractRaw.annual_leave_days ?? contractRaw.leaves ?? "",
      template: contractRaw.template || "",
      structure: compRaw.structure || "",
      basic_salary: compRaw.basic_salary || "",
      currency: currencyValue,
      transportation: compRaw.transportation || "",
      housing: compRaw.housing || "",
      other_allowances: compRaw.other_allowances || "",
      social_security: compRaw.social_security || "",
      health_insurance: compRaw.health_insurance || "",
      other_deductions: compRaw.other_deductions || "",
    });
    setContractMode("edit");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync only when server payload or employee changes; `contractForm` is stable from RHF
  }, [employeeId, historyQuery.data]);

  const submitContract = async (values, options = {}) => {
    const successEdit =
      options.successMessageEdit || "Contract and compensation updated.";
    const successCreate =
      options.successMessageCreate || "Contract and compensation created.";
    const currencyId = String(values.currency ?? "").trim();
    if (!currencyId || !looksLikeUuid(currencyId)) {
      toast.error(t('contractSalary.selectCurrency'));
      return false;
    }

    const payload = {
      contract_data: {
        contract_type: values.contract_type,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        annual_leave_days: Number(values.annual_leave_days || 0),
        template: values.template || null,
      },
      compensation_data: {
        structure: values.structure || null,
        basic_salary: String(values.basic_salary || "0"),
        currency: currencyId,
        transportation: String(values.transportation || "0"),
        housing: String(values.housing || "0"),
        other_allowances: String(values.other_allowances || "0"),
        social_security: String(values.social_security || "0"),
        health_insurance: String(values.health_insurance || "0"),
        other_deductions: String(values.other_deductions || "0"),
      },
    };

    try {
      if (contractMode === "edit") {
        await updateContractMutation.mutateAsync(payload);
        toast.success(successEdit);
      } else {
        await createContractMutation.mutateAsync(payload);
        toast.success(successCreate);
        setContractMode("edit");
      }
      return true;
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Could not save contract and compensation."),
      );
      return false;
    }
  };

  const submitSalaryIncrease = async (values) => {
    if (!employeeId) {
      toast.error(t('contractSalary.employeeRequiredIncrease'));
      return;
    }
    try {
      await createSalaryIncreaseMutation.mutateAsync({
        effective_date: formatDate(values.effective_date),
        new_basic_salary: formatApiDecimalAmount(values.new_basic_salary),
        reason: values.reason?.trim() || "",
      });
      toast.success(t('contractSalary.increaseSaved'));
      setIsSalaryModalOpen(false);
      salaryIncreaseForm.reset(salaryIncreaseDefaults);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save salary increase."));
    }
  };

  const submitEvaluation = async (values) => {
    if (!employeeId) {
      toast.error(t('contractSalary.employeeRequiredEval'));
      return;
    }
    try {
      await createEvaluationMutation.mutateAsync({
        review_period_start: formatDate(values.review_period_start),
        review_period_end: formatDate(values.review_period_end),
        job_knowledge: Number(values.job_knowledge),
        work_quality: Number(values.work_quality),
        attendance: Number(values.attendance),
        communication: Number(values.communication),
        initiative: Number(values.initiative),
        comments: values.comments?.trim() || "",
      });
      toast.success(t('contractSalary.evalSaved'));
      setIsEvaluationModalOpen(false);
      evaluationForm.reset(evaluationDefaults);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save evaluation."));
    }
  };

  const confirmDeleteContract = async () => {
    if (!contractToDelete?.id) return;
    try {
      await deleteContractMutation.mutateAsync(contractToDelete.id);
      toast.success(t('contractSalary.entryDeleted'));
      setContractToDelete(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not delete contract entry."));
    }
  };

  const handleGenerateTemplate = async () => {
    if (!selectedTemplateId) {
      toast.error(t('contractSalary.selectTemplate'));
      return;
    }

    try {
      const response = await renderTemplateMutation.mutateAsync({
        templateId: selectedTemplateId,
        body: { employee_id: employeeId },
      });
      const html = getRenderedTemplateHtml(response);
      if (!html) {
        toast.error("Template render returned empty HTML.");
        return;
      }
      setRenderedContractHtml(html);
      setRenderedTemplateId(selectedTemplateId);
      toast.success(t('contractSalary.templateGenerated'));
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Could not render contract template."),
      );
    }
  };

  const handleCopyRenderedTemplate = async () => {
    const contentToCopy = getHtmlCopyContent(renderedContractHtml);
    if (!contentToCopy) return;
    await navigator.clipboard.writeText(contentToCopy);
    toast.success(t('contractSalary.copied'));
  };

  const handlePrintRenderedTemplate = () => {

    if (!renderedContractHtml) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
      <head>
        <title></title>
        <style>
          @page { size: auto; margin: 0; }
          html, body { margin: 0; padding: 0; }
          body {
            font-family: 'Times New Roman', serif;
            line-height: 1.8;
            font-size: 14px;
            color: #000;
            background: #fff;
          }
          .print-root {
            padding: 20px;
          }
        </style>
      </head>
      <body>
        <div class="print-root">${renderedContractHtml}</div>
      </body>
      </html>
    `);
    printWindow.document.title = "";
    printWindow.document.close();
    printWindow.print();
  };

  const openRenewContractModal = () => {
    setContractMode("edit");
    setIsRenewalModalOpen(true);
  };

  const handleConfirmRenewal = async () => {
    setContractMode("edit");
    const todayStr = getTodayIsoDate();
    const values = {
      ...contractForm.getValues(),
      start_date: todayStr,
      end_date: "",
    };
    const ok = await submitContract(values, {
      successMessageEdit: "Contract renewed.",
    });
    if (ok) {
      contractForm.setValue("start_date", todayStr);
      contractForm.setValue("end_date", "");
      setIsRenewalModalOpen(false);
    }
  };

  if (!employeeId) {
    return (
      <Card className="padding-lg">
        <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
          Save the employee first, then you can manage contract and salary
          details.
        </p>
      </Card>
    );
  }

  if (isLoading) {
    return <Spinner />;
  }

  if (hasError) {
    return (
      <Card className="padding-lg">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            alignItems: "flex-start",
          }}
        >
          <p style={{ margin: 0, color: "var(--color-error)" }}>
            Could not load contract and salary data.
          </p>
          <Button
            variant="outline"
            type="button"
            onClick={() => historyQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const salaryRows = parseArray(historyData?.salary_history);
  const contractRows = parseArray(historyData?.contract_history);
  const evaluationRows = parseArray(historyData?.performance_evaluations);
  const selectedCurrencyId = String(watchedCurrency ?? "").trim();
  const selectedCurrencyItem =
    selectedCurrencyId && looksLikeUuid(selectedCurrencyId)
      ? currencies.find((c) => getCurrencyItemId(c) === selectedCurrencyId)
      : null;
  const activeCurrency =
    normalizeCurrencyCode(selectedCurrencyItem?.code) ||
    compensationCurrencyDisplayCode(currentCompensation, currencies) ||
    "JOD";
  const renewalEndDateDisplay = toIsoDateDisplay(
    contractForm.watch("end_date") || currentContract?.end_date,
  );
  const renewalNewStartDate = getTodayIsoDate();
  const renewalSalaryDisplay = formatSalaryDisplay(
    contractForm.watch("basic_salary"),
    activeCurrency,
  );
  const liveNetSalary =
    Number(contractForm.watch("basic_salary") || 0) +
    Number(contractForm.watch("transportation") || 0) +
    Number(contractForm.watch("housing") || 0) +
    Number(contractForm.watch("other_allowances") || 0) -
    Number(contractForm.watch("social_security") || 0) -
    Number(contractForm.watch("health_insurance") || 0) -
    Number(contractForm.watch("other_deductions") || 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "1rem",
        }}
      >
        <Card className="padding-lg">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1.05rem" }}>Contract Details</h3>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "999px",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-secondary)",
                }}
              >
                {currentContract?.status?.[0]?.toUpperCase() +
                  currentContract?.status?.slice(1) ||
                  (hasCurrentContract ? "Active" : "No Contract")}
              </span>
              {hasCurrentContract ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={<RefreshCw size={14} />}
                  onClick={openRenewContractModal}
                >
                  Renew Contract
                </Button>
              ) : null}
            </div>
          </div>

          <div style={{ display: "grid", gap: "0.85rem" }}>
            <SelectField
              control={contractForm.control}
              name="contract_type"
              label="Contract Type"
              options={[
                { value: "full_time", label: "Full-Time" },
                { value: "part_time", label: "Part-Time" },
                { value: "temporary", label: "Temporary" },
              ]}
            />
            <Controller
              name="start_date"
              control={contractForm.control}
              render={({ field }) => (
                <Input type="date" label="Contract Start Date" {...field} />
              )}
            />
            <Controller
              name="end_date"
              control={contractForm.control}
              render={({ field }) => (
                <Input
                  type="date"
                  label="Contract End Date (Optional)"
                  {...field}
                />
              )}
            />
            <Controller
              name="annual_leave_days"
              control={contractForm.control}
              render={({ field }) => (
                <Input
                  type="number"
                  label="Annual Leave Entitlement (Days)"
                  {...field}
                />
              )}
            />
            <div>
              <div
                style={{
                  marginBottom: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                Generate Contract from Template
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "0.5rem",
                }}
              >
                <SelectField
                  control={contractForm.control}
                  name="template"
                  label=""
                  withLabel={false}
                  withEmpty
                  emptyLabel="Select template..."
                  options={templates.map((template) => ({
                    value: template?.id || template?.uuid || "",
                    label:
                      template?.name || template?.title || "Unnamed template",
                  }))}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={
                    hasGeneratedSelectedTemplate
                      ? () => setIsTemplatePreviewOpen(true)
                      : handleGenerateTemplate
                  }
                  isLoading={renderTemplateMutation.isPending}
                  disabled={!selectedTemplateId}
                >
                  {hasGeneratedSelectedTemplate ? "Preview" : "Generate"}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="padding-lg">
          <h3
            style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.05rem" }}
          >
            Salary & Compensation
          </h3>
          <div style={{ display: "grid", gap: "0.85rem" }}>
            <SelectField
              control={contractForm.control}
              name="structure"
              label="Salary Structure"
              options={structures.map((structure) => ({
                value: structure?.id || structure?.uuid || "",
                label:
                  structure?.name || structure?.title || "Unnamed structure",
              }))}
              withEmpty
              emptyLabel="Select structure..."
            />
            <p
              style={{
                margin: 0,
                color: "var(--color-text-secondary)",
                fontSize: "0.82rem",
              }}
            >
              Assigning a structure automatically applies defined components
              during payroll processing.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 160px",
                gap: "0.75rem",
              }}
            >
              <Controller
                name="basic_salary"
                control={contractForm.control}
                render={({ field }) => (
                  <Input
                    type="number"
                    step="0.01"
                    label="Basic Salary"
                    {...field}
                  />
                )}
              />
              <Controller
                name="currency"
                control={contractForm.control}
                render={({ field }) => {
                  return (
                    <SelectWithLoadMore
                      id="contract-salary-currency"
                      label="Currency"
                      value={String(field.value ?? "").trim()}
                      onChange={(next) =>
                        field.onChange(
                          next != null && next !== ""
                            ? String(next).trim()
                            : "",
                        )
                      }
                      options={currencySelectOptions}
                      disabled={currenciesFailed}
                      isInitialLoading={
                        currenciesInitialLoading && !currenciesQuery.data
                      }
                      hasMore={
                        Boolean(currenciesHasNextPage) && !currenciesFailed
                      }
                      onLoadMore={() => fetchNextCurrenciesPage()}
                      isLoadingMore={isFetchingNextCurrenciesPage}
                      paginationError={
                        currenciesFailed
                          ? "Failed to load currencies."
                          : isFetchNextCurrenciesPageError
                            ? "Could not load more currencies. Scroll down to retry."
                            : null
                      }
                    />
                  );
                }}
              />
            </div>

            <div
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem",
              }}
            >
              <div
                style={{
                  marginBottom: "0.5rem",
                  fontSize: "0.8rem",
                  color: "var(--color-text-secondary)",
                  fontWeight: 600,
                }}
              >
                STRUCTURE COMPONENTS PREVIEW
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {(structureComponents.length
                  ? structureComponents
                  : [{ name: "No components available", value: "" }]
                ).map((item) => (
                  <span
                    key={`${item.name}-${item.value}`}
                    style={{
                      border: "1px solid var(--color-border)",
                      borderRadius: "6px",
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.78rem",
                      background: "var(--color-bg-surface)",
                    }}
                  >
                    <strong>{item.name}</strong>{" "}
                    {item.value ? `: ${item.value}` : ""}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gap: "0.7rem" }}>
              <div style={{ fontWeight: 600 }}>Allowances (+)</div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: "0.6rem",
                }}
              >
                <Controller
                  name="transportation"
                  control={contractForm.control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      step="0.01"
                      label="Transportation"
                      {...field}
                    />
                  )}
                />
                <Controller
                  name="housing"
                  control={contractForm.control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      step="0.01"
                      label="Housing"
                      {...field}
                    />
                  )}
                />
                <Controller
                  name="other_allowances"
                  control={contractForm.control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      step="0.01"
                      label="Other Allowances"
                      {...field}
                    />
                  )}
                />
              </div>
            </div>

            <div style={{ display: "grid", gap: "0.7rem" }}>
              <div style={{ fontWeight: 600 }}>Deductions (-)</div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: "0.6rem",
                }}
              >
                <Controller
                  name="social_security"
                  control={contractForm.control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      step="0.01"
                      label="Social Security"
                      {...field}
                    />
                  )}
                />
                <Controller
                  name="health_insurance"
                  control={contractForm.control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      step="0.01"
                      label="Health Insurance"
                      {...field}
                    />
                  )}
                />
                <Controller
                  name="other_deductions"
                  control={contractForm.control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      step="0.01"
                      label="Other Deductions"
                      {...field}
                    />
                  )}
                />
              </div>
            </div>

            <div
              style={{
                border: "1px solid #d7dcff",
                background: "var(--color-bg-primary-soft)",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                  Estimated Net Salary
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  (Based on selected Structure & Schemes)
                </div>
              </div>
              <div
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  color: "var(--color-primary)",
                }}
              >
                {formatMoney(liveNetSalary, activeCurrency)}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                type="button"
                isLoading={
                  createContractMutation.isPending ||
                  updateContractMutation.isPending
                }
                onClick={contractForm.handleSubmit(submitContract)}
              >
                {contractMode === "edit"
                  ? "Save Changes"
                  : "Save Contract & Salary"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Card className="padding-lg">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.75rem",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.05rem" }}>Contract History</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: "680px",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Period</th>
                <th style={tableHeaderStyle}>Salary</th>
                <th style={tableHeaderStyle}>Document</th>
                <th style={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contractRows.length === 0 ? (
                <tr>
                  <td
                    style={{
                      ...tableCellStyle,
                      textAlign: "center",
                      color: "var(--color-text-secondary)",
                    }}
                    colSpan={4}
                  >
                    No contract history available.
                  </td>
                </tr>
              ) : (
                contractRows.map((row) => (
                  <tr key={row?.id || row?.contract_id}>
                    <td style={tableCellStyle}>
                      <div style={{ display: "grid", gap: "0.25rem" }}>
                        <span>{getContractPeriodDisplay(row)}</span>
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          Status: {row?.status || "-"}
                        </span>
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      {formatMoney(
                        row?.salary || row?.basic_salary,
                        rowCurrencyDisplayCode(
                          row?.currency,
                          currencies,
                          activeCurrency,
                        ),
                      )}
                    </td>
                    <td style={tableCellStyle}>
                      {row?.document ? (
                        <div
                          style={{
                            display: "flex",
                            gap: "0.6rem",
                            alignItems: "center",
                          }}
                        >
                          <button
                            type="button"
                            style={linkLikeButtonStyle}
                            onClick={() =>
                              window.open(
                                row.document,
                                "_blank",
                                "noopener,noreferrer",
                              )
                            }
                          >
                            <FileText size={14} /> Open
                          </button>
                          <button
                            type="button"
                            style={linkLikeButtonStyle}
                            onClick={() =>
                              window.open(
                                row.document,
                                "_blank",
                                "noopener,noreferrer",
                              )
                            }
                          >
                            <Eye size={14} /> View
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: "var(--color-text-secondary)" }}>
                          No document
                        </span>
                      )}
                    </td>
                    <td style={tableCellStyle}>
                      <Button
                        type="button"
                        variant="outline"
                        icon={<Trash2 size={14} />}
                        onClick={() =>
                          setContractToDelete({
                            id: row?.id || row?.contract_id,
                          })
                        }
                      >{t('common:actions.delete')}</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="padding-lg">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.75rem",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.05rem" }}>Salary History</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            icon={<Plus size={14} />}
            onClick={() => setIsSalaryModalOpen(true)}
          >
            Add Increase
          </Button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: "560px",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Date</th>
                <th style={tableHeaderStyle}>Amount</th>
                <th style={tableHeaderStyle}>Reason</th>
              </tr>
            </thead>
            <tbody>
              {salaryRows.length === 0 ? (
                <tr>
                  <td
                    style={{
                      ...tableCellStyle,
                      textAlign: "center",
                      color: "var(--color-text-secondary)",
                    }}
                    colSpan={3}
                  >
                    No salary history available.
                  </td>
                </tr>
              ) : (
                salaryRows.map((row) => (
                  <tr key={row?.id || row?.effective_date}>
                    <td style={tableCellStyle}>
                      {formatDateDisplay(row?.effective_date || row?.date)}
                    </td>
                    <td style={tableCellStyle}>
                      {formatMoney(
                        row?.new_basic_salary || row?.amount,
                        rowCurrencyDisplayCode(
                          row?.currency,
                          currencies,
                          activeCurrency,
                        ),
                      )}
                    </td>
                    <td style={tableCellStyle}>{row?.reason || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="padding-lg">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.75rem",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.05rem" }}>
            Performance Evaluations
          </h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            icon={<Plus size={14} />}
            onClick={() => setIsEvaluationModalOpen(true)}
          >
            Add Review
          </Button>
        </div>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {evaluationRows.length === 0 ? (
            <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
              No performance evaluations available.
            </p>
          ) : (
            evaluationRows.map((item) => (
              <div
                key={item?.id || item?.review_period_end}
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.75rem",
                  display: "grid",
                  gap: "0.35rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                  }}
                >
                  <strong>
                    {item?.review_period_start && item?.review_period_end
                      ? `${formatDateDisplay(item.review_period_start)} - ${formatDateDisplay(item.review_period_end)}`
                      : formatDateDisplay(
                          item?.review_period_end || item?.review_period_start,
                        )}
                  </strong>
                  <span
                    style={{ color: "var(--color-primary)", fontWeight: 700 }}
                  >
                    {item?.calculated_score ?? item?.overall_score ?? "-"}/5
                  </span>
                </div>
                <div
                  style={{
                    color: "var(--color-text-secondary)",
                    fontSize: "0.84rem",
                  }}
                >
                  Evaluated by {item?.reviewer_name || item?.evaluator || "N/A"}
                </div>
                <div
                  style={{
                    fontStyle: "italic",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {item?.comments || "No comment provided."}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Modal
        isOpen={isRenewalModalOpen}
        onClose={() => setIsRenewalModalOpen(false)}
        title="Confirm Contract Renewal"
        size="sm"
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "var(--color-bg-primary-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
            }}
          >
            <FileText size={28} style={{ color: "var(--color-primary)" }} />
          </div>
          <h4
            style={{
              margin: "0 0 0.5rem",
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "var(--color-text-main)",
            }}
          >
            Ready to renew?
          </h4>
          <p
            style={{
              margin: "0 0 1.25rem",
              color: "var(--color-text-secondary)",
              fontSize: "0.9rem",
              lineHeight: 1.55,
            }}
          >
            This will archive the current contract (ending{" "}
            <strong style={{ color: "var(--color-text-main)" }}>
              {renewalEndDateDisplay || "—"}
            </strong>
            ) to history and create a new contract period starting today.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              textAlign: "left",
              marginBottom: "1.5rem",
              padding: "0.85rem",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              background: "var(--color-bg-surface)",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-secondary)",
                  marginBottom: "0.25rem",
                  fontWeight: 500,
                }}
              >
                Current Salary
              </div>
              <div style={{ fontWeight: 700, color: "var(--color-text-main)" }}>
                {renewalSalaryDisplay}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-secondary)",
                  marginBottom: "0.25rem",
                  fontWeight: 500,
                }}
              >
                New Start Date
              </div>
              <div style={{ fontWeight: 700, color: "var(--color-primary)" }}>
                {renewalNewStartDate}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsRenewalModalOpen(false)}
            >{t('common:actions.cancel')}</Button>
            <Button
              type="button"
              onClick={handleConfirmRenewal}
              isLoading={updateContractMutation.isPending}
            >
              Confirm Renewal
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isTemplatePreviewOpen}
        onClose={() => setIsTemplatePreviewOpen(false)}
        title="Generated Contract Preview"
        size="xl"
      >
        <ContractTemplatesPreviewView
          templateDetailsQuery={{ isLoading: false, isError: false }}
          previewTemplateName={
            selectedTemplate?.name ||
            selectedTemplate?.title ||
            "Contract Preview"
          }
          isWidePreviewHeader={false}
          navigate={() => setIsTemplatePreviewOpen(false)}
          previewHtml={renderedContractHtml}
          onCopy={handleCopyRenderedTemplate}
          onPrint={handlePrintRenderedTemplate}
          isRenderingPreview={renderTemplateMutation.isPending}
        />
      </Modal>

      <Modal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        title="Salary Increase"
        size="sm"
      >
        <form
          onSubmit={salaryIncreaseForm.handleSubmit(submitSalaryIncrease)}
          style={{ display: "grid", gap: "0.9rem" }}
        >
          <Controller
            name="effective_date"
            control={salaryIncreaseForm.control}
            rules={{ required: "Effective date is required." }}
            render={({ field, fieldState }) => (
              <Input
                type="date"
                label="Effective Date"
                error={fieldState.error?.message}
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={formatDate(field.value)}
                onChange={(e) => field.onChange(formatDate(e.target.value))}
              />
            )}
          />
          <Controller
            name="new_basic_salary"
            control={salaryIncreaseForm.control}
            rules={{
              required: "New basic salary is required.",
              validate: (value) =>
                Number(value) > 0 || "Salary must be greater than zero.",
            }}
            render={({ field, fieldState }) => (
              <Input
                type="number"
                step="0.01"
                min="0.01"
                label="New Basic Salary"
                error={fieldState.error?.message}
                {...field}
              />
            )}
          />
          <Controller
            name="reason"
            control={salaryIncreaseForm.control}
            render={({ field }) => <Input label="Reason" {...field} />}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSalaryModalOpen(false)}
            >{t('common:actions.cancel')}</Button>
            <Button
              type="submit"
              isLoading={createSalaryIncreaseMutation.isPending}
            >{t('common:actions.save')}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEvaluationModalOpen}
        onClose={() => setIsEvaluationModalOpen(false)}
        title="Performance Evaluation"
        size="md"
      >
        <form
          onSubmit={evaluationForm.handleSubmit(submitEvaluation)}
          style={{ display: "grid", gap: "0.9rem" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.9rem",
            }}
          >
            <Controller
              name="review_period_start"
              control={evaluationForm.control}
              rules={{ required: "Review start date is required." }}
              render={({ field, fieldState }) => (
                <Input
                  type="date"
                  label="Review Start"
                  error={fieldState.error?.message}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={formatDate(field.value)}
                  onChange={(e) => field.onChange(formatDate(e.target.value))}
                />
              )}
            />
            <Controller
              name="review_period_end"
              control={evaluationForm.control}
              rules={{ required: "Review end date is required." }}
              render={({ field, fieldState }) => (
                <Input
                  type="date"
                  label="Review End"
                  error={fieldState.error?.message}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={formatDate(field.value)}
                  onChange={(e) => field.onChange(formatDate(e.target.value))}
                />
              )}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "0.9rem",
            }}
          >
            <ScoreField
              control={evaluationForm.control}
              name="job_knowledge"
              label="Job Knowledge"
            />
            <ScoreField
              control={evaluationForm.control}
              name="work_quality"
              label="Work Quality"
            />
            <ScoreField
              control={evaluationForm.control}
              name="attendance"
              label="Attendance"
            />
            <ScoreField
              control={evaluationForm.control}
              name="communication"
              label="Communication"
            />
            <ScoreField
              control={evaluationForm.control}
              name="initiative"
              label="Initiative"
            />
          </div>
          <Controller
            name="comments"
            control={evaluationForm.control}
            render={({ field }) => (
              <div>
                <label style={labelStyle}>Comments</label>
                <textarea
                  {...field}
                  rows={3}
                  style={{
                    ...selectStyle,
                    resize: "vertical",
                    minHeight: "88px",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            )}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEvaluationModalOpen(false)}
            >{t('common:actions.cancel')}</Button>
            <Button
              type="submit"
              isLoading={createEvaluationMutation.isPending}
            >{t('common:actions.save')}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={!!contractToDelete}
        type="danger"
        title="Delete Contract Entry"
        message="This will remove this contract item from employee history."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setContractToDelete(null)}
        onConfirm={confirmDeleteContract}
      />
    </div>
  );
};

const SelectField = ({
  control,
  name,
  label,
  options,
  withEmpty = false,
  emptyLabel = "Select option",
  withLabel = true,
}) => (
  <div>
    {withLabel ? <label style={labelStyle}>{label}</label> : null}
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <select {...field} style={selectStyle}>
          {withEmpty && <option value="">{emptyLabel}</option>}
          {options.map((option) => (
            <option key={`${name}-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    />
  </div>
);

const linkLikeButtonStyle = {
  border: "none",
  background: "transparent",
  color: "var(--color-primary)",
  display: "inline-flex",
  alignItems: "center",
  gap: "0.3rem",
  cursor: "pointer",
  padding: 0,
  fontSize: "0.83rem",
};

const ScoreField = ({ control, name, label }) => (
  <SelectField
    control={control}
    name={name}
    label={label}
    options={[
      { value: 1, label: "1" },
      { value: 2, label: "2" },
      { value: 3, label: "3" },
      { value: 4, label: "4" },
      { value: 5, label: "5" },
    ]}
  />
);

export default ContractSalaryTab;

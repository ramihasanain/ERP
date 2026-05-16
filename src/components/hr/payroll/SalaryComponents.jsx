import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Card from "@/components/Shared/Card";
import Button from "@/components/Shared/Button";
import Input from "@/components/Shared/Input";
import useCustomQuery from "@/hooks/useQuery";
import {
  useCustomPost,
  useCustomPut,
  useCustomRemove,
} from "@/hooks/useMutation";
import Spinner from "@/core/Spinner";
import ResourceLoadError from "@/core/ResourceLoadError";
import { toast } from "sonner";
import translateApiError from "@/utils/translateApiError";
import { getApiErrorMessage } from "@/utils/apiErrorMessage";
import { Plus, Edit2, Trash2, DollarSign, TrendingDown } from "lucide-react";
import FormulaBuilder from "@/components/hr/payroll/FormulaBuilder";

const parseArray = (value) => {
  const { t } = useTranslation(["hr", "common"]);
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

const mapComponentTypeToApi = (type) => {
  const normalized = String(type || "")
    .trim()
    .toLowerCase();
  if (normalized === "deduction") return "deduction";
  if (normalized === "contribution" || normalized === "company contribution")
    return "contribution";
  return "earning";
};

const mapCalculationToApi = (calculationType) => {
  const normalized = String(calculationType || "")
    .trim()
    .toLowerCase();
  if (normalized === "percentage") return "percentage";
  if (normalized === "formula") return "formula";
  return "fixed";
};

const mapApiTypeToForm = (type) => {
  const normalized = String(type || "")
    .trim()
    .toLowerCase();
  if (normalized === "deduction") return "Deduction";
  if (normalized === "contribution") return "Contribution";
  return "Earning";
};

const mapApiCalculationToForm = (calculation) => {
  const normalized = String(calculation || "")
    .trim()
    .toLowerCase();
  if (normalized === "percentage") return "Percentage";
  if (normalized === "formula") return "Formula";
  return "Fixed";
};

const INITIAL_FORM_DATA = {
  code: "",
  name: "",
  type: "Earning",
  calculationType: "Fixed",
  isTaxable: true,
  glCode: "",
  formula: "",
};

const normalizeFormForCompare = (data) => ({
  name: (data.name || "").trim(),
  code: (data.code || "").trim(),
  type: data.type,
  calculationType: data.calculationType,
  isTaxable: Boolean(data.isTaxable),
  glCode: (data.glCode || "").trim(),
  formula: (data.formula || "").trim(),
});

const SalaryComponents = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [componentToDelete, setComponentToDelete] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [editFormBaseline, setEditFormBaseline] = useState(null);
  const salaryComponentsQuery = useCustomQuery("/api/hr/salary-components/", [
    "hr-salary-components",
  ]);
  const createSalaryComponentMutation = useCustomPost(
    "/api/hr/salary-components/",
    [["hr-salary-components"]],
  );
  const updateSalaryComponentMutation = useCustomPut(
    editingId
      ? `/api/hr/salary-components/${editingId}/`
      : "/api/hr/salary-components/",
    [["hr-salary-components"]],
  );
  const deleteSalaryComponentMutation = useCustomRemove(
    (componentId) => `/api/hr/salary-components/${componentId}/`,
    [["hr-salary-components"]],
  );
  const variables = [
    { code: "BASIC", name: "Basic Salary" },
    { code: "GROSS", name: "Gross Pay" },
    { code: "OT_HOURS", name: "Overtime Hours" },
    { code: "ABSENT_DAYS", name: "Absent Days" },
    { code: "WORKING_DAYS", name: "Working Days" },
  ];

  const listedComponents = useMemo(() => {
    return parseArray(salaryComponentsQuery.data).map((component) => ({
      id: component.id,
      name: component.name || "",
      code: component.code || "",
      type: component.component_type_display || component.component_type || "",
      calculationType:
        component.calculation_display || component.calculation || "",
      isTaxable: Boolean(component.is_taxable),
      glCode: component.gl_code || "",
      formula: component.formula || "",
    }));
  }, [salaryComponentsQuery.data]);

  const isEditFormDirty = useMemo(() => {
    if (!editingId || editFormBaseline === null) return true;
    return (
      JSON.stringify(normalizeFormForCompare(formData)) !==
      JSON.stringify(editFormBaseline)
    );
  }, [editingId, formData, editFormBaseline]);

  const isCreateFormValid = useMemo(() => {
    if (editingId) return true;
    const nameOk = (formData.name || "").trim().length > 0;
    const codeOk = (formData.code || "").trim().length > 0;
    if (!nameOk || !codeOk) return false;
    if (formData.calculationType === "Formula") {
      return (formData.formula || "").trim().length > 0;
    }
    return true;
  }, [
    editingId,
    formData.name,
    formData.code,
    formData.calculationType,
    formData.formula,
  ]);

  const resetFormState = () => {
    setEditingId(null);
    setEditFormBaseline(null);
    setFormData(INITIAL_FORM_DATA);
  };

  const openCreateModal = () => {
    resetFormState();
    setIsModalOpen(true);
  };

  const buildSalaryComponentPayload = () => {
    const calculation = mapCalculationToApi(formData.calculationType);
    return {
      name: formData.name.trim(),
      code: formData.code.trim(),
      component_type: mapComponentTypeToApi(formData.type),
      calculation,
      formula: calculation === "formula" ? (formData.formula || "").trim() : "",
      gl_code: (formData.glCode || "").trim(),
      is_taxable: Boolean(formData.isTaxable),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = buildSalaryComponentPayload();

    if (editingId) {
      try {
        await updateSalaryComponentMutation.mutateAsync(payload);
        toast.success(t("salaryComponents.updated"));
        setIsModalOpen(false);
        resetFormState();
      } catch (error) {
        toast.error(
          getApiErrorMessage(error, "Could not update salary component."),
        );
      }
      return;
    }

    try {
      await createSalaryComponentMutation.mutateAsync(payload);
      toast.success(t("salaryComponents.created"));
      setIsModalOpen(false);
      resetFormState();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Could not create salary component."),
      );
    }
  };

  const openEdit = (comp) => {
    const nextForm = {
      code: comp.code || "",
      name: comp.name || "",
      type: mapApiTypeToForm(comp.type) || "Earning",
      calculationType: mapApiCalculationToForm(comp.calculationType) || "Fixed",
      isTaxable: Boolean(comp.isTaxable),
      glCode: comp.glCode || "",
      formula: comp.formula || "",
    };
    setEditingId(comp.id);
    setFormData(nextForm);
    setEditFormBaseline(normalizeFormForCompare(nextForm));
    setIsModalOpen(true);
  };

  const openDeleteModal = (comp) => {
    setComponentToDelete(comp);
  };

  const closeDeleteModal = () => {
    setComponentToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!componentToDelete || deleteSalaryComponentMutation.isPending) return;
    try {
      await deleteSalaryComponentMutation.mutateAsync(componentToDelete.id);
      toast.success(t("salaryComponents.deleted"));
      closeDeleteModal();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Could not delete salary component."),
      );
    }
  };

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
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700 }}>
            Salary Components
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Manage earnings, deductions, and company contributions.
          </p>
        </div>
        <Button icon={<Plus size={16} />} onClick={openCreateModal}>
          Add Component
        </Button>
      </div>

      {salaryComponentsQuery.isLoading ? (
        <Card className="padding-md">
          <Spinner />
        </Card>
      ) : salaryComponentsQuery.isError ? (
        <ResourceLoadError
          resourceName="Salary components"
          onRetry={salaryComponentsQuery.refetch}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {listedComponents.map((comp) => (
            <Card key={comp.id} className="padding-md">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "1rem",
                }}
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
                      padding: "0.5rem",
                      borderRadius: "50%",
                      background:
                        String(comp.type).toLowerCase() === "deduction"
                          ? "var(--color-error-50)"
                          : "var(--color-success-50)",
                      color:
                        String(comp.type).toLowerCase() === "deduction"
                          ? "var(--color-error-600)"
                          : "var(--color-success-600)",
                    }}
                  >
                    {String(comp.type).toLowerCase() === "deduction" ? (
                      <TrendingDown size={20} />
                    ) : (
                      <DollarSign size={20} />
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 600, fontSize: "1rem" }}>
                      {comp.name}
                    </h3>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.1rem 0.5rem",
                        background: "var(--color-slate-100)",
                        borderRadius: "4px",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {comp.code}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Edit2 size={16} />}
                    onClick={() => openEdit(comp)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={16} />}
                    onClick={() => openDeleteModal(comp)}
                    style={{ color: "var(--color-error)" }}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.5rem",
                  fontSize: "0.85rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                <div>
                  Type:{" "}
                  <span
                    style={{
                      fontWeight: 500,
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {comp.type}
                  </span>
                </div>
                <div>
                  Calc:{" "}
                  <span
                    style={{
                      fontWeight: 500,
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {comp.calculationType}
                  </span>
                </div>
                <div>
                  Taxable:{" "}
                  <span
                    style={{
                      fontWeight: 500,
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {comp.isTaxable ? "Yes" : "No"}
                  </span>
                </div>
                <div>
                  GL Code:{" "}
                  <span
                    style={{
                      fontWeight: 500,
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {comp.glCode || "-"}
                  </span>
                </div>
              </div>
            </Card>
          ))}
          {!listedComponents.length && (
            <Card className="padding-md">
              <p style={{ color: "var(--color-text-secondary)" }}>
                No salary components found.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Simple Modal Implementation */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
            overflowY: "auto",
          }}
        >
          <Card
            style={{
              width: "min(640px, 100%)",
              maxWidth: "100%",
              padding: "2rem",
            }}
          >
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                marginBottom: "1.5rem",
              }}
            >
              {editingId ? "Edit Component" : "New Component"}
            </h2>
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <Input
                  label="Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
                <Input
                  label="Code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  required
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                  >
                    Type
                  </label>
                  <select
                    style={{
                      width: "100%",
                      padding: "0.625rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                    }}
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                  >
                    <option value="Earning">Earning</option>
                    <option value="Deduction">Deduction</option>
                    <option value="Contribution">Company Contribution</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                  >
                    Calculation
                  </label>
                  <select
                    style={{
                      width: "100%",
                      padding: "0.625rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                    }}
                    value={formData.calculationType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        calculationType: e.target.value,
                      })
                    }
                  >
                    <option value="Fixed">Fixed Amount</option>
                    <option value="Percentage">Percentage</option>
                    <option value="Formula">Formula</option>
                  </select>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginTop: "1.75rem",
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.isTaxable}
                  onChange={(e) =>
                    setFormData({ ...formData, isTaxable: e.target.checked })
                  }
                />
                <label>Is Taxable?</label>
              </div>

              {formData.calculationType === "Formula" && (
                <div style={{ marginTop: "0.5rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                  >
                    Formula Configuration
                  </label>
                  <FormulaBuilder
                    value={formData.formula}
                    onChange={(val) =>
                      setFormData({ ...formData, formula: val })
                    }
                    variables={variables}
                  />
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "1rem",
                  marginTop: "1rem",
                }}
              >
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetFormState();
                  }}
                >
                  {t("common:actions.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createSalaryComponentMutation.isPending ||
                    updateSalaryComponentMutation.isPending ||
                    (Boolean(editingId) && !isEditFormDirty) ||
                    (!editingId && !isCreateFormValid)
                  }
                >
                  {editingId
                    ? updateSalaryComponentMutation.isPending
                      ? "Updating..."
                      : "Update"
                    : createSalaryComponentMutation.isPending
                      ? "Creating..."
                      : "Create"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {componentToDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <Card style={{ width: "420px", padding: "1.5rem" }}>
            <h2
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
              }}
            >
              Delete Component
            </h2>
            <p
              style={{
                color: "var(--color-text-secondary)",
                marginBottom: "1.25rem",
              }}
            >
              Are you sure you want to delete{" "}
              <strong>{componentToDelete.name}</strong>? This action cannot be
              undone.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
              }}
            >
              <Button type="button" variant="ghost" onClick={closeDeleteModal}>
                {t("common:actions.cancel")}
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteSalaryComponentMutation.isPending}
                style={{
                  background: "var(--color-error)",
                  borderColor: "var(--color-error)",
                }}
              >
                {deleteSalaryComponentMutation.isPending
                  ? "Deleting..."
                  : "Delete"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SalaryComponents;

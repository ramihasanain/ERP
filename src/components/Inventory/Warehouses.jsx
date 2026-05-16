import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from 'react-i18next';
import Card from "@/components/Shared/Card";
import Button from "@/components/Shared/Button";
import Modal from "@/components/Shared/Modal";
import ConfirmationModal from "@/components/Shared/ConfirmationModal";
import Spinner from "@/core/Spinner";
import SearchableSelectBackend from "@/core/SearchableSelectBackend";
import useCustomQuery from "@/hooks/useQuery";
import {
  useCustomPost,
  useCustomPut,
  useCustomRemove,
} from "@/hooks/useMutation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import translateApiError from '@/utils/translateApiError';
import { Plus, Edit, Trash2, MapPin, User, Warehouse, Eye } from "lucide-react";

const normalizeArrayResponse = (response) => {
    const { t } = useTranslation(['inventory', 'common']);
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const getEntityId = (entity) => entity?.id || entity?.uuid || "";

const normalizeWarehouse = (item) => ({
  id: getEntityId(item),
  name: item?.name || "",
  location: item?.location || "",
  manager: item?.manager || item?.manager_id || item?.managerId || "",
  managerName: (item?.manager_name && String(item.manager_name).trim()) || "",
  raw: item,
});

const normalizeWarehouses = (response) =>
  normalizeArrayResponse(response).map(normalizeWarehouse);

const getEmployeeRoleKey = (item) => {
  const raw = item?.role ?? item?.user_data?.role;
  if (raw == null || raw === "") return "";
  if (typeof raw === "string") return raw.trim().toLowerCase();
  if (typeof raw === "object") {
    const nested = raw.name ?? raw.slug ?? raw.code ?? raw.label;
    if (typeof nested === "string") return nested.trim().toLowerCase();
  }
  return String(raw).toLowerCase();
};

const normalizeEmployee = (item) => {
  const userData = item?.user_data || {};
  const firstName = item?.first_name ?? userData?.first_name ?? "";
  const lastName = item?.last_name ?? userData?.last_name ?? "";
  const email = item?.email ?? userData?.email ?? "";
  return {
    id: getEntityId(item),
    fullName: `${firstName} ${lastName}`.trim() || email || t("warehouses.unknown"),
    email,
    status: item?.status ?? userData?.status ?? "",
    roleKey: getEmployeeRoleKey(item),
  };
};

const normalizeEmployees = (response) =>
  normalizeArrayResponse(response).map(normalizeEmployee);

const Warehouses = () => {
  const [isNarrowScreen, setIsNarrowScreen] = useState(
    () => window.innerWidth < 1100,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [managerSearchTerm, setManagerSearchTerm] = useState("");

  const warehousesQuery = useCustomQuery(
    "/api/inventory/warehouses/",
    ["inventory-warehouses"],
    {
      select: normalizeWarehouses,
    },
  );

  const employeesQuery = useCustomQuery(
    "/api/hr/employees/",
    ["hr-employees"],
    {
      select: normalizeEmployees,
    },
  );

  const warehouseDetailsQuery = useCustomQuery(
    selectedWarehouseId
      ? `/api/inventory/warehouses/${selectedWarehouseId}/`
      : "/api/inventory/warehouses/",
    ["inventory-warehouse-detail", selectedWarehouseId],
    {
      enabled: Boolean(selectedWarehouseId && isDetailOpen),
      select: normalizeWarehouse,
    },
  );

  const createWarehouse = useCustomPost("/api/inventory/warehouses/create/", [
    "inventory-warehouses",
  ]);
  const updateWarehouse = useCustomPut(
    (data) => `/api/inventory/warehouses/${data.id}/`,
    ["inventory-warehouses", "inventory-warehouse-detail"],
  );
  const deleteWarehouse = useCustomRemove(
    (id) => `/api/inventory/warehouses/${id}/delete/`,
    ["inventory-warehouses", "inventory-warehouse-detail"],
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      location: "",
      manager: "",
    },
  });

  const warehouses = useMemo(
    () => warehousesQuery.data ?? [],
    [warehousesQuery.data],
  );
  const employees = useMemo(
    () => employeesQuery.data ?? [],
    [employeesQuery.data],
  );

  const managerEmployees = useMemo(() => {
    const activeEmployees = employees.filter(
      (employee) => String(employee.status).toLowerCase() === "active",
    );
    const byId = new Map(activeEmployees.map((e) => [e.id, e]));
    const currentId = editingWarehouse?.manager;

    if (currentId && !byId.has(currentId)) {
      const fromAll = employees.find((e) => e.id === currentId);
      if (fromAll) {
        activeEmployees.push(fromAll);
        byId.set(fromAll.id, fromAll);
      } else {
        activeEmployees.push({
          id: currentId,
          fullName: editingWarehouse?.managerName?.trim() || t("warehouses.currentManager"),
          email: "",
          status: "",
          roleKey: "",
        });
      }
    }

    const term = managerSearchTerm.trim().toLowerCase();
    if (!term) return activeEmployees;
    return activeEmployees.filter((employee) => {
      const name = employee.fullName?.toLowerCase() || "";
      const email = employee.email?.toLowerCase() || "";
      return name.includes(term) || email.includes(term);
    });
  }, [employees, editingWarehouse, managerSearchTerm]);

  const managerNameMap = useMemo(
    () =>
      new Map(employees.map((employee) => [employee.id, employee.fullName])),
    [employees],
  );

  const selectedWarehouse = useMemo(() => {
    if (warehouseDetailsQuery.data) return warehouseDetailsQuery.data;
    return (
      warehouses.find((warehouse) => warehouse.id === selectedWarehouseId) ||
      null
    );
  }, [warehouseDetailsQuery.data, warehouses, selectedWarehouseId]);

  const handleEdit = (warehouse) => {
    setEditingWarehouse(warehouse);
    setManagerSearchTerm("");
    reset({
      name: warehouse.name || "",
      location: warehouse.location || "",
      manager: warehouse.manager || "",
    });
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingWarehouse(null);
    setManagerSearchTerm("");
    reset({ name: "", location: "", manager: "" });
    setIsFormOpen(true);
  };

  const handleView = (warehouseId) => {
    setSelectedWarehouseId(warehouseId);
    setIsDetailOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailOpen(false);
    setSelectedWarehouseId(null);
  };

  const onSubmit = async (values) => {
    const managerId =
      typeof values.manager === "string" && values.manager.trim() !== ""
        ? values.manager.trim()
        : null;
    const payload = {
      name: values.name.trim(),
      location: values.location.trim(),
      manager: managerId,
    };

    try {
      if (editingWarehouse?.id) {
        await updateWarehouse.mutateAsync({
          id: editingWarehouse.id,
          ...payload,
        });
        toast.success(t('warehouses.updateSuccess'));
      } else {
        await createWarehouse.mutateAsync(payload);
        toast.success(t('warehouses.createSuccess'));
      }

      setIsFormOpen(false);
      setEditingWarehouse(null);
      reset({ name: "", location: "", manager: "" });
    } catch (error) {
      toast.error(translateApiError(error, 'inventory:warehouses.saveFailed'));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;

    try {
      await deleteWarehouse.mutateAsync(deleteTarget.id);
      toast.success(t('warehouses.deleteSuccess'));
      setDeleteTarget(null);
      if (selectedWarehouseId === deleteTarget.id) {
        closeDetailModal();
      }
    } catch (error) {
      toast.error(translateApiError(error, 'inventory:warehouses.deleteFailed'));
    }
  };

  const isLoading = warehousesQuery.isLoading || employeesQuery.isLoading;
  const hasError = warehousesQuery.isError || employeesQuery.isError;

  const handleRetry = async () => {
    try {
      await Promise.all([warehousesQuery.refetch(), employeesQuery.refetch()]);
      toast.success(t('warehouses.refreshSuccess'));
    } catch {
      toast.error(t('warehouses.refreshFailed'));
    }
  };

  useEffect(() => {
    const onResize = () => setIsNarrowScreen(window.innerWidth < 1100);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          flexDirection: isNarrowScreen ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isNarrowScreen ? "flex-start" : "center",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700 }}>{t("warehouses.title")}</h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            {t("warehouses.subtitle")}
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={18} />}
          size={isNarrowScreen ? "sm" : undefined}
          onClick={handleAdd}
          style={{ alignSelf: isNarrowScreen ? "flex-end" : "auto" }}
        >
          {t("warehouses.addWarehouse")}
        </Button>
      </div>

      {isLoading && <Spinner />}

      {hasError && (
        <Card className="padding-lg">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              alignItems: "flex-start",
            }}
          >
            <p style={{ margin: 0, color: "var(--color-error)" }}>
              {t("warehouses.loadFailed")}
            </p>
            <Button variant="outline" onClick={handleRetry}>
              {t("common:actions.retry")}
            </Button>
          </div>
        </Card>
      )}

      {!isLoading && !hasError && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {warehouses.length === 0 ? (
            <Card className="padding-lg">
              <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
                {t('warehouses.empty')}
              </p>
            </Card>
          ) : (
            warehouses.map((wh) => (
              <Card
                key={wh.id}
                className="padding-md"
                style={{ borderTop: "4px solid var(--color-secondary-500)" }}
              >
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
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <div
                      style={{
                        padding: "0.75rem",
                        background:
                          "color-mix(in srgb, var(--color-secondary-500) 14%, var(--color-bg-card))",
                        borderRadius: "50%",
                        color: "var(--color-secondary-600)",
                      }}
                    >
                      <Warehouse size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 600, fontSize: "1.1rem" }}>
                        {wh.name}
                      </h3>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          fontSize: "0.85rem",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        <MapPin size={14} />
                        <span>{wh.location || t("warehouses.noLocation")}</span>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleView(wh.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--color-text-secondary)",
                      }}
                      title={t("common:actions.view")}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(wh)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--color-text-secondary)",
                      }}
                      title={t('actions.edit', { ns: 'common' })}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(wh)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--color-error)",
                      }}
                      title={t('actions.delete', { ns: 'common' })}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    padding: "1rem",
                    background: "var(--color-bg-secondary)",
                    borderRadius: "var(--radius-sm)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.9rem",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <User size={16} color="var(--color-text-muted)" />
                  <span style={{ color: "var(--color-text-secondary)" }}>
                    {t("warehouses.manager")}
                  </span>
                  <span style={{ fontWeight: 500 }}>
                    {managerNameMap.get(wh.manager) ||
                      wh.managerName ||
                      t("warehouses.unassigned")}
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingWarehouse(null);
        }}
        title={editingWarehouse ? t('warehouses.editWarehouse') : t('warehouses.addWarehouseModal')}
        size="md"
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div>
            <label style={labelStyle}>{t('warehouses.warehouseName')}</label>
            <input
              {...register("name", { required: t("warehouses.nameRequired") })}
              style={inputStyle}
              placeholder={t("warehouses.namePlaceholder")}
            />
            {errors.name && <p style={errorStyle}>{errors.name.message}</p>}
          </div>

          <div>
            <label style={labelStyle}>{t('warehouses.location')}</label>
            <input
              {...register("location", {
                required: t("warehouses.locationRequired"),
              })}
              style={inputStyle}
              placeholder={t("warehouses.locationPlaceholder")}
            />
            {errors.location && (
              <p style={errorStyle}>{errors.location.message}</p>
            )}
          </div>

          <div>
            <label style={labelStyle}>{t('warehouses.manager')}</label>
            <Controller
              name="manager"
              control={control}
              render={({ field }) => (
                <SearchableSelectBackend
                  value={field.value || ""}
                  onChange={(nextValue) => field.onChange(nextValue)}
                  options={managerEmployees.map((employee) => ({
                    value: employee.id,
                    label: employee.email
                      ? `${employee.fullName} (${employee.email})`
                      : employee.fullName,
                  }))}
                  searchTerm={managerSearchTerm}
                  onSearchChange={setManagerSearchTerm}
                  placeholder={t("warehouses.selectManager")}
                  emptyLabel={
                    employeesQuery.isLoading
                      ? t("common:actions.loading")
                      : t("warehouses.noEmployees")
                  }
                  isInitialLoading={employeesQuery.isLoading}
                  disabled={employeesQuery.isLoading || employeesQuery.isError}
                  zIndex={1050}
                />
              )}
            />
          </div>

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
              variant="outline"
              onClick={() => {
                setIsFormOpen(false);
                setEditingWarehouse(null);
              }}
            >{t('actions.cancel', { ns: 'common' })}</Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createWarehouse.isPending || updateWarehouse.isPending}
            >
              {editingWarehouse ? t("common:actions.update") : t("common:actions.create")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDetailOpen}
        onClose={closeDetailModal}
        title={t("warehouses.details")}
        size="md"
      >
        {warehouseDetailsQuery.isLoading ? (
          <Spinner />
        ) : !selectedWarehouse ? (
          <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
            {t("warehouses.detailsUnavailable")}
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div style={detailRowStyle}>
              <span style={detailLabelStyle}>{t("warehouses.nameLabel")}</span>
              <span>{selectedWarehouse.name || "--"}</span>
            </div>
            <div style={detailRowStyle}>
              <span style={detailLabelStyle}>{t("warehouses.locationLabel")}</span>
              <span>{selectedWarehouse.location || "--"}</span>
            </div>
            <div style={detailRowStyle}>
              <span style={detailLabelStyle}>{t("warehouses.manager")}</span>
              <span>
                {managerNameMap.get(selectedWarehouse.manager) ||
                  selectedWarehouse.managerName ||
                  t("warehouses.unassigned")}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                marginTop: "1rem",
              }}
            >
              <Button
                variant="outline"
                icon={<Edit size={16} />}
                onClick={() => {
                  closeDetailModal();
                  handleEdit(selectedWarehouse);
                }}
              >{t('actions.edit', { ns: 'common' })}</Button>
              <Button
                variant="danger"
                icon={<Trash2 size={16} />}
                onClick={() => setDeleteTarget(selectedWarehouse)}
              >{t('actions.delete', { ns: 'common' })}</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        title={t("warehouses.deleteTitle")}
        type="danger"
        message={t('warehouses.deleteMessage', { name: deleteTarget?.name || t('warehouses.deleteFallbackName') })}
        confirmText={t("common:actions.delete")}
        cancelText={t("common:actions.cancel")}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

const labelStyle = {
  display: "block",
  marginBottom: "0.4rem",
  fontWeight: 500,
  fontSize: "0.9rem",
  color: "var(--color-text-main)",
};
const inputStyle = {
  width: "100%",
  padding: "0.6rem",
  borderRadius: "4px",
  border: "1px solid var(--color-border)",
  background: "var(--color-bg-surface)",
  color: "var(--color-text-main)",
};
const errorStyle = {
  marginTop: "0.35rem",
  marginBottom: 0,
  color: "var(--color-error)",
  fontSize: "0.8rem",
};
const detailRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "1rem",
  paddingBottom: "0.5rem",
  borderBottom: "1px solid var(--color-border)",
};
const detailLabelStyle = {
  fontWeight: 600,
  color: "var(--color-text-secondary)",
};

export default Warehouses;

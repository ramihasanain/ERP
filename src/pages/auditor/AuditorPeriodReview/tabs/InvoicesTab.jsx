import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import Card from "@/components/Shared/Card";
import Button from "@/components/Shared/Button";
import Spinner from "@/core/Spinner";
import InvoiceForm from "@/components/Accounting/InvoiceForm";
import useCustomQuery from "@/hooks/useQuery";
import { useCustomPost } from "@/hooks/useMutation";
import { getApiErrorMessage } from "@/utils/apiErrorMessage";
import { Plus, Edit3, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const normalizeOptions = (data) => {
  const customers = (data?.customers || [])
    .filter((c) => c.is_active !== false)
    .map((c) => ({
      id: c.id,
      name: c.name || "Unnamed customer",
      contactPerson: c.contact_person || "",
      email: c.email || "",
      phone: c.phone || "",
      currencyCode: c.currency_code || "",
    }));

  const products = (data?.sales_catalog_items || []).map((ci) => {
    const item = ci.item || {};
    return {
      id: ci.id,
      productId: ci.product_id || ci.id,
      name: item.name || ci.name || "Unnamed item",
      sku: item.sku || "",
      price: toNumber(ci.selling_price),
      description: item.description || item.name || "",
      taxRuleId: ci.tax_rule || "",
      taxRuleName: ci.tax_display || "",
    };
  });

  const warehouses = (data?.warehouses || []).map((w) => ({
    id: w.id,
    name: w.name || "Unnamed warehouse",
    location: w.location || "",
  }));

  const taxRules = (data?.tax_rules || []).map((r) => ({
    id: r.id,
    name: r.name || "Unnamed tax rule",
    rate: toNumber(r.rate_percent ?? r.rate),
  }));

  return { customers, products, warehouses, taxRules };
};

const InvoicesTab = () => {
  const { periodId } = useParams();
  const [formModal, setFormModal] = useState(null);

  const invoicesQuery = useCustomQuery(
    `/api/auditing/portal/periods/${periodId}/invoices/`,
    ["auditor-period-invoices", periodId],
  );

  const optionsQuery = useCustomQuery(
    `/api/auditing/portal/periods/${periodId}/invoice-options/`,
    ["auditor-period-invoice-options", periodId],
  );

  const changeRequestMutation = useCustomPost(
    `/api/auditing/portal/periods/${periodId}/change-requests/`,
    [["auditor-period-invoices", periodId]],
  );

  const invoices = useMemo(() => {
    const raw = invoicesQuery.data;
    return Array.isArray(raw) ? raw : raw?.results || [];
  }, [invoicesQuery.data]);

  const options = useMemo(
    () => normalizeOptions(optionsQuery.data),
    [optionsQuery.data],
  );

  const openCreate = () => setFormModal({ mode: "create", invoice: null });

  const openEdit = (inv) => setFormModal({ mode: "edit", invoice: inv });

  const closeModal = () => setFormModal(null);

  const handleSubmit = async (payload) => {
    const isEdit = formModal?.mode === "edit";
    try {
      await changeRequestMutation.mutateAsync({
        title: isEdit
          ? `Update invoice ${formModal.invoice?.number || formModal.invoice?.id || ""}`
          : "Create new invoice",
        target_area: "invoice",
        action: isEdit ? "update" : "create",
        target_object_id: isEdit ? formModal.invoice.id : "",
        proposed_payload: payload,
      });
      toast.success(
        isEdit
          ? "Invoice update request submitted."
          : "Invoice creation request submitted.",
      );
      closeModal();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          isEdit
            ? "Failed to submit invoice update."
            : "Failed to submit invoice creation.",
        ),
      );
    }
  };

  const handleDelete = async (inv) => {
    if (!confirm(`Delete invoice ${inv.number || inv.id}?`)) return;
    try {
      await changeRequestMutation.mutateAsync({
        title: `Delete invoice ${inv.number || inv.id}`,
        target_area: "invoice",
        action: "delete",
        target_object_id: inv.id,
        proposed_payload: {},
      });
      toast.success("Invoice deletion request submitted.");
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Failed to submit invoice deletion."),
      );
    }
  };

  if (invoicesQuery.isLoading) {
    return (
      <div style={{ minHeight: 200, display: "grid", placeItems: "center" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <Card className="padding-none">
        <div
          style={{
            padding: "0.75rem 1rem",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h4 style={{ fontWeight: 700 }}>Invoices ({invoices.length})</h4>
          <Button size="sm" icon={<Plus size={14} />} onClick={openCreate}>
            Add Invoice
          </Button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.8rem",
            }}
          >
            <thead>
              <tr style={{ background: "var(--color-slate-50)" }}>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>
                  Invoice #
                </th>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>
                  Customer
                </th>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>Date</th>
                <th style={{ padding: "8px 12px", textAlign: "right" }}>
                  Amount
                </th>
                <th style={{ padding: "8px 12px", textAlign: "center" }}>
                  Status
                </th>
                <th
                  style={{
                    padding: "8px 12px",
                    textAlign: "center",
                    width: "90px",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                >
                  <td style={{ padding: "6px 12px", fontWeight: 600 }}>
                    {inv.number || inv.id}
                  </td>
                  <td style={{ padding: "6px 12px" }}>
                    {inv.customer_name || "N/A"}
                  </td>
                  <td
                    style={{
                      padding: "6px 12px",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {inv.invoice_date}
                  </td>
                  <td
                    style={{
                      padding: "6px 12px",
                      textAlign: "right",
                      fontWeight: 600,
                    }}
                  >
                    {toNumber(inv.grand_total).toLocaleString()}
                  </td>
                  <td style={{ padding: "6px 12px", textAlign: "center" }}>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontWeight: 600,
                        background:
                          inv.status === "paid"
                            ? "var(--color-success-dim)"
                            : inv.status === "sent"
                              ? "var(--color-warning-dim)"
                              : "var(--color-slate-100)",
                        color:
                          inv.status === "paid"
                            ? "var(--color-success)"
                            : inv.status === "sent"
                              ? "var(--color-warning)"
                              : "var(--color-text-secondary)",
                      }}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ padding: "6px 12px", textAlign: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.25rem",
                        justifyContent: "center",
                      }}
                    >
                      <button
                        onClick={() => openEdit(inv)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--color-primary-600)",
                          padding: "2px",
                        }}
                        title="Edit"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(inv)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--color-error)",
                          padding: "2px",
                        }}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {formModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            zIndex: 9999,
            overflowY: "auto",
            padding: "2rem 1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            style={{
              background: "var(--color-bg-surface, white)",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "1100px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              overflow: "visible",
              position: "relative",
            }}
          >
            <div
              style={{
                padding: "1rem 1.5rem",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                {formModal.mode === "edit"
                  ? `Edit Invoice: ${formModal.invoice?.number || ""}`
                  : "Create Invoice"}
              </h3>
              <button
                onClick={closeModal}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-secondary)",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <InvoiceForm
                customerOptions={options.customers}
                productOptions={options.products}
                warehouseOptions={options.warehouses}
                taxOptions={options.taxRules}
                initialInvoice={
                  formModal.mode === "edit" ? formModal.invoice : null
                }
                onSubmit={handleSubmit}
                onCancel={closeModal}
                isSubmitting={changeRequestMutation.isPending}
                submitLabel={
                  formModal.mode === "edit"
                    ? "Submit Update Request"
                    : "Submit Invoice Request"
                }
                showNotes={false}
                dropdownZIndexBase={10000}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InvoicesTab;

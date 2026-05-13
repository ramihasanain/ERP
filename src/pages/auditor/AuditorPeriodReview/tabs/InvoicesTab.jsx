import { useParams, useOutletContext } from "react-router-dom";
import Card from "@/components/Shared/Card";
import Button from "@/components/Shared/Button";
import { useAccounting } from "@/context/AccountingContext";
import { Plus, Edit3, Trash2 } from "lucide-react";

const InvoicesTab = () => {
  const { companyId, periodId } = useParams();
  const { setEditModal, logChange } = useOutletContext();
  const { invoices, setInvoices } = useAccounting();

  return (
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
        <h4 style={{ fontWeight: 700 }}>Invoices ({invoices?.length || 0})</h4>
        <Button
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => {
            setEditModal({
              title: "Add New Invoice",
              fields: [
                {
                  key: "invoiceNumber",
                  label: "Invoice Number",
                  value: "",
                  type: "text",
                },
                {
                  key: "customerName",
                  label: "Customer Name",
                  value: "",
                  type: "text",
                },
                {
                  key: "date",
                  label: "Date",
                  value: new Date().toISOString().split("T")[0],
                  type: "text",
                },
                {
                  key: "total",
                  label: "Total Amount",
                  value: "",
                  type: "number",
                },
                {
                  key: "status",
                  label: "Status (Draft/Sent/Paid)",
                  value: "Draft",
                  type: "text",
                },
              ],
              onSave: (vals) => {
                if (vals.invoiceNumber && vals.total) {
                  const newInv = {
                    id: `INV-${Date.now()}`,
                    invoiceNumber: vals.invoiceNumber,
                    customerName: vals.customerName,
                    date: vals.date,
                    total: parseFloat(vals.total) || 0,
                    status: vals.status || "Draft",
                  };
                  setInvoices((prev) => [...(prev || []), newInv]);
                  logChange({
                    entityType: "invoice",
                    entityId: newInv.id,
                    field: "new invoice",
                    oldValue: "\u2014",
                    newValue: `${vals.invoiceNumber} - ${vals.customerName} - ${vals.total}`,
                    periodId,
                    companyId,
                  });
                }
              },
            });
          }}
        >
          Add Invoice
        </Button>
      </div>
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
            <th style={{ padding: "8px 12px", textAlign: "left" }}>Customer</th>
            <th style={{ padding: "8px 12px", textAlign: "left" }}>Date</th>
            <th style={{ padding: "8px 12px", textAlign: "right" }}>Amount</th>
            <th style={{ padding: "8px 12px", textAlign: "center" }}>Status</th>
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
          {(invoices || []).map((inv) => (
            <tr
              key={inv.id}
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <td style={{ padding: "6px 12px", fontWeight: 600 }}>
                {inv.invoiceNumber || inv.id}
              </td>
              <td style={{ padding: "6px 12px" }}>
                {inv.customerName || "N/A"}
              </td>
              <td
                style={{
                  padding: "6px 12px",
                  color: "var(--color-text-muted)",
                }}
              >
                {inv.date}
              </td>
              <td
                style={{
                  padding: "6px 12px",
                  textAlign: "right",
                  fontWeight: 600,
                }}
              >
                {(inv.total || 0).toLocaleString()}
              </td>
              <td style={{ padding: "6px 12px", textAlign: "center" }}>
                <span
                  style={{
                    fontSize: "0.65rem",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    fontWeight: 600,
                    background:
                      inv.status === "Paid"
                        ? "var(--color-success-dim)"
                        : inv.status === "Sent"
                          ? "var(--color-warning-dim)"
                          : "var(--color-slate-100)",
                    color:
                      inv.status === "Paid"
                        ? "var(--color-success)"
                        : inv.status === "Sent"
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
                    onClick={() => {
                      setEditModal({
                        title: `Edit Invoice: ${inv.invoiceNumber || inv.id}`,
                        fields: [
                          {
                            key: "customerName",
                            label: "Customer Name",
                            value: inv.customerName || "",
                            oldValue: inv.customerName || "",
                            type: "text",
                          },
                          {
                            key: "date",
                            label: "Date",
                            value: inv.date || "",
                            oldValue: inv.date || "",
                            type: "text",
                          },
                          {
                            key: "total",
                            label: "Total Amount",
                            value: inv.total || 0,
                            oldValue: String(inv.total || 0),
                            type: "number",
                          },
                          {
                            key: "status",
                            label: "Status (Draft/Sent/Paid)",
                            value: inv.status || "",
                            oldValue: inv.status || "",
                            type: "text",
                          },
                        ],
                        onSave: (vals) => {
                          const newTotal = parseFloat(vals.total) || 0;
                          if (vals.customerName !== inv.customerName)
                            logChange({
                              entityType: "invoice",
                              entityId: inv.id,
                              field: "customer",
                              oldValue: inv.customerName || "",
                              newValue: vals.customerName,
                              periodId,
                              companyId,
                            });
                          if (newTotal !== (inv.total || 0))
                            logChange({
                              entityType: "invoice",
                              entityId: inv.id,
                              field: "total",
                              oldValue: String(inv.total || 0),
                              newValue: String(newTotal),
                              periodId,
                              companyId,
                            });
                          if (vals.status !== inv.status)
                            logChange({
                              entityType: "invoice",
                              entityId: inv.id,
                              field: "status",
                              oldValue: inv.status || "",
                              newValue: vals.status,
                              periodId,
                              companyId,
                            });
                          if (vals.date !== inv.date)
                            logChange({
                              entityType: "invoice",
                              entityId: inv.id,
                              field: "date",
                              oldValue: inv.date || "",
                              newValue: vals.date,
                              periodId,
                              companyId,
                            });
                        },
                      });
                    }}
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
                    onClick={() => {
                      if (
                        confirm(
                          `Delete invoice ${inv.invoiceNumber || inv.id}?`,
                        )
                      ) {
                        logChange({
                          entityType: "invoice",
                          entityId: inv.id,
                          field: "deleted",
                          oldValue: `${inv.invoiceNumber} - ${inv.total}`,
                          newValue: "\u2014 (deleted)",
                          periodId,
                          companyId,
                        });
                      }
                    }}
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
          {(!invoices || invoices.length === 0) && (
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
    </Card>
  );
};

export default InvoicesTab;

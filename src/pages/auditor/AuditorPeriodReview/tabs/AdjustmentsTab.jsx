import { useState } from "react";
import { useParams } from "react-router-dom";
import Card from "@/components/Shared/Card";
import Button from "@/components/Shared/Button";
import { useAudit } from "@/context/AuditContext";
import { Edit3, CheckCircle } from "lucide-react";

const adjStatusConfig = {
  pending: {
    label: "Pending Approval",
    bg: "var(--color-warning-dim)",
    color: "var(--color-warning)",
  },
  approved: {
    label: "Approved",
    bg: "var(--color-success-dim)",
    color: "var(--color-success)",
  },
  rejected: {
    label: "Rejected",
    bg: "var(--color-error-dim)",
    color: "var(--color-error)",
  },
};

const AdjustmentsTab = () => {
  const { companyId, periodId } = useParams();
  const { proposeAdjustment, getAdjustmentsForPeriod } = useAudit();

  const periodAdjs = getAdjustmentsForPeriod(periodId);

  const [showNewAdjForm, setShowNewAdjForm] = useState(false);
  const [newAdjTitle, setNewAdjTitle] = useState("");
  const [newAdjDescription, setNewAdjDescription] = useState("");
  const [newAdjLines, setNewAdjLines] = useState([
    { account: "", accountName: "", debit: 0, credit: 0 },
  ]);

  const handleSubmitAdj = () => {
    if (!newAdjTitle.trim() || !newAdjDescription.trim()) return;
    const validLines = newAdjLines.filter(
      (l) => l.accountName && (l.debit > 0 || l.credit > 0),
    );
    if (validLines.length === 0) return;
    proposeAdjustment({
      periodId,
      companyId,
      type: "journal_entry",
      title: newAdjTitle,
      description: newAdjDescription,
      changes: {
        entryId: `JE-ADJ-${Date.now()}`,
        lines: validLines,
      },
    });
    setNewAdjTitle("");
    setNewAdjDescription("");
    setNewAdjLines([{ account: "", accountName: "", debit: 0, credit: 0 }]);
    setShowNewAdjForm(false);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>
            Proposed Adjustments
          </h3>
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--color-text-muted)",
            }}
          >
            Propose accounting adjustments that require admin approval.
          </p>
        </div>
        <Button
          icon={<Edit3 size={14} />}
          onClick={() => setShowNewAdjForm(!showNewAdjForm)}
        >
          {showNewAdjForm ? "Cancel" : "New Adjustment"}
        </Button>
      </div>

      {showNewAdjForm && (
        <Card
          className="padding-lg"
          style={{
            border: "2px solid var(--color-primary-600)",
            background: "var(--color-primary-50)",
          }}
        >
          <h4
            style={{
              fontWeight: 700,
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Edit3 size={16} /> Propose New Adjustment
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <label
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  display: "block",
                  marginBottom: "0.25rem",
                }}
              >
                Title
              </label>
              <input
                value={newAdjTitle}
                onChange={(e) => setNewAdjTitle(e.target.value)}
                placeholder="e.g. Revenue Recognition Correction"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "6px",
                  border: "1px solid var(--color-border)",
                  fontSize: "0.85rem",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  display: "block",
                  marginBottom: "0.25rem",
                }}
              >
                Type
              </label>
              <select
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "6px",
                  border: "1px solid var(--color-border)",
                  fontSize: "0.85rem",
                }}
              >
                <option>Journal Entry Adjustment</option>
                <option>Account Reclassification</option>
                <option>Accrual Adjustment</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--color-text-muted)",
                display: "block",
                marginBottom: "0.25rem",
              }}
            >
              Justification / Description
            </label>
            <textarea
              value={newAdjDescription}
              onChange={(e) => setNewAdjDescription(e.target.value)}
              placeholder="Explain the reason for this adjustment per applicable standards (IFRS, local GAAP)..."
              style={{
                width: "100%",
                minHeight: "80px",
                padding: "0.5rem",
                borderRadius: "6px",
                border: "1px solid var(--color-border)",
                fontSize: "0.85rem",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--color-text-muted)",
                display: "block",
                marginBottom: "0.5rem",
              }}
            >
              Journal Entry Lines
            </label>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.82rem",
              }}
            >
              <thead>
                <tr style={{ background: "white" }}>
                  <th style={{ padding: "6px 8px", textAlign: "left" }}>
                    Account Code
                  </th>
                  <th style={{ padding: "6px 8px", textAlign: "left" }}>
                    Account Name
                  </th>
                  <th
                    style={{
                      padding: "6px 8px",
                      textAlign: "right",
                      width: "120px",
                    }}
                  >
                    Debit
                  </th>
                  <th
                    style={{
                      padding: "6px 8px",
                      textAlign: "right",
                      width: "120px",
                    }}
                  >
                    Credit
                  </th>
                  <th style={{ padding: "6px 8px", width: "40px" }}></th>
                </tr>
              </thead>
              <tbody>
                {newAdjLines.map((line, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: "4px 8px" }}>
                      <input
                        value={line.account}
                        onChange={(e) => {
                          const lines = [...newAdjLines];
                          lines[idx].account = e.target.value;
                          setNewAdjLines(lines);
                        }}
                        placeholder="e.g. 4110"
                        style={{
                          width: "100%",
                          padding: "4px 6px",
                          borderRadius: "4px",
                          border: "1px solid var(--color-border)",
                          fontFamily: "monospace",
                          fontSize: "0.8rem",
                        }}
                      />
                    </td>
                    <td style={{ padding: "4px 8px" }}>
                      <input
                        value={line.accountName}
                        onChange={(e) => {
                          const lines = [...newAdjLines];
                          lines[idx].accountName = e.target.value;
                          setNewAdjLines(lines);
                        }}
                        placeholder="e.g. Sales Revenue"
                        style={{
                          width: "100%",
                          padding: "4px 6px",
                          borderRadius: "4px",
                          border: "1px solid var(--color-border)",
                          fontSize: "0.8rem",
                        }}
                      />
                    </td>
                    <td style={{ padding: "4px 8px" }}>
                      <input
                        type="number"
                        value={line.debit || ""}
                        onChange={(e) => {
                          const lines = [...newAdjLines];
                          lines[idx].debit = parseFloat(e.target.value) || 0;
                          setNewAdjLines(lines);
                        }}
                        placeholder="0"
                        style={{
                          width: "100%",
                          padding: "4px 6px",
                          borderRadius: "4px",
                          border: "1px solid var(--color-border)",
                          textAlign: "right",
                          fontSize: "0.8rem",
                        }}
                      />
                    </td>
                    <td style={{ padding: "4px 8px" }}>
                      <input
                        type="number"
                        value={line.credit || ""}
                        onChange={(e) => {
                          const lines = [...newAdjLines];
                          lines[idx].credit = parseFloat(e.target.value) || 0;
                          setNewAdjLines(lines);
                        }}
                        placeholder="0"
                        style={{
                          width: "100%",
                          padding: "4px 6px",
                          borderRadius: "4px",
                          border: "1px solid var(--color-border)",
                          textAlign: "right",
                          fontSize: "0.8rem",
                        }}
                      />
                    </td>
                    <td
                      style={{
                        padding: "4px 8px",
                        textAlign: "center",
                      }}
                    >
                      {newAdjLines.length > 1 && (
                        <button
                          onClick={() =>
                            setNewAdjLines(
                              newAdjLines.filter((_, i) => i !== idx),
                            )
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--color-error)",
                            cursor: "pointer",
                            fontSize: "1.1rem",
                          }}
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "0.5rem",
              }}
            >
              <button
                onClick={() =>
                  setNewAdjLines([
                    ...newAdjLines,
                    { account: "", accountName: "", debit: 0, credit: 0 },
                  ])
                }
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-primary-600)",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                + Add Line
              </button>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                }}
              >
                Total Debit:{" "}
                <strong>
                  {newAdjLines
                    .reduce((s, l) => s + (l.debit || 0), 0)
                    .toLocaleString()}
                </strong>{" "}
                &nbsp;|&nbsp; Total Credit:{" "}
                <strong>
                  {newAdjLines
                    .reduce((s, l) => s + (l.credit || 0), 0)
                    .toLocaleString()}
                </strong>
                {newAdjLines.reduce((s, l) => s + (l.debit || 0), 0) !==
                  newAdjLines.reduce((s, l) => s + (l.credit || 0), 0) && (
                  <span
                    style={{
                      color: "var(--color-error)",
                      marginLeft: "0.5rem",
                    }}
                  >
                    ⚠ Unbalanced
                  </span>
                )}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "flex-end",
            }}
          >
            <Button variant="ghost" onClick={() => setShowNewAdjForm(false)}>
              Cancel
            </Button>
            <Button
              icon={<CheckCircle size={14} />}
              onClick={handleSubmitAdj}
              style={{ background: "var(--color-primary-600)" }}
            >
              Submit for Admin Approval
            </Button>
          </div>
        </Card>
      )}

      {periodAdjs.length === 0 && !showNewAdjForm ? (
        <Card className="padding-lg" style={{ textAlign: "center" }}>
          <Edit3
            size={40}
            style={{
              color: "var(--color-text-muted)",
              marginBottom: "0.75rem",
            }}
          />
          <p style={{ fontWeight: 500 }}>No adjustments proposed yet</p>
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--color-text-secondary)",
            }}
          >
            Click "New Adjustment" to propose an accounting change.
          </p>
        </Card>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {periodAdjs.map((adj) => {
            const sc = adjStatusConfig[adj.status];
            return (
              <Card
                key={adj.id}
                className="padding-md"
                style={{ borderLeft: `4px solid ${sc.color}` }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div>
                    <h4
                      style={{
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {adj.title}
                    </h4>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {adj.description}
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "6px",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        background: sc.bg,
                        color: sc.color,
                      }}
                    >
                      {sc.label}
                    </span>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {adj.createdAt}
                    </span>
                  </div>
                </div>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.78rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "var(--color-slate-50)",
                      }}
                    >
                      <th
                        style={{
                          padding: "5px 10px",
                          textAlign: "left",
                        }}
                      >
                        Account
                      </th>
                      <th
                        style={{
                          padding: "5px 10px",
                          textAlign: "left",
                        }}
                      >
                        Name
                      </th>
                      <th
                        style={{
                          padding: "5px 10px",
                          textAlign: "right",
                        }}
                      >
                        Debit
                      </th>
                      <th
                        style={{
                          padding: "5px 10px",
                          textAlign: "right",
                        }}
                      >
                        Credit
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {adj.changes.lines.map((line, i) => (
                      <tr
                        key={i}
                        style={{
                          borderTop: "1px solid var(--color-border)",
                        }}
                      >
                        <td
                          style={{
                            padding: "5px 10px",
                            fontFamily: "monospace",
                            fontSize: "0.75rem",
                          }}
                        >
                          {line.account}
                        </td>
                        <td style={{ padding: "5px 10px" }}>
                          {line.accountName}
                        </td>
                        <td
                          style={{
                            padding: "5px 10px",
                            textAlign: "right",
                            fontWeight: 600,
                            color:
                              line.debit > 0
                                ? "var(--color-success)"
                                : "var(--color-text-muted)",
                          }}
                        >
                          {line.debit > 0 ? line.debit.toLocaleString() : "—"}
                        </td>
                        <td
                          style={{
                            padding: "5px 10px",
                            textAlign: "right",
                            fontWeight: 600,
                            color:
                              line.credit > 0
                                ? "var(--color-error)"
                                : "var(--color-text-muted)",
                          }}
                        >
                          {line.credit > 0
                            ? line.credit.toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {adj.adminNotes && (
                  <div
                    style={{
                      padding: "0.5rem 0.75rem",
                      borderRadius: "6px",
                      background:
                        adj.status === "approved"
                          ? "var(--color-success-dim)"
                          : adj.status === "rejected"
                            ? "var(--color-error-dim)"
                            : "var(--color-slate-50)",
                      fontSize: "0.78rem",
                    }}
                  >
                    <strong>Admin Response:</strong> {adj.adminNotes}
                    {adj.reviewedAt && (
                      <span
                        style={{
                          float: "right",
                          color: "var(--color-text-muted)",
                          fontSize: "0.7rem",
                        }}
                      >
                        Reviewed: {adj.reviewedAt}
                      </span>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdjustmentsTab;

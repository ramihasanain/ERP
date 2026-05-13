import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Card from "@/components/Shared/Card";
import useCustomQuery from "@/hooks/useQuery";
import Spinner from "@/core/Spinner";
import ResourceLoadError from "@/core/ResourceLoadError";
import Pagination from "@/core/Pagination";
import { patch } from "@/api";
import { getApiErrorMessage } from "@/utils/apiErrorMessage";

const PAGE_SIZE = 15;

const assignmentsListFromPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const rolesListFromPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const initialsFromFullName = (name) => {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

/**
 * @param {{ enabled: boolean }} props — fetch assignments only when this tab is active.
 */
const PermissionsEmployeeAssignmentsTab = ({ enabled }) => {
  const queryClient = useQueryClient();
  const [assignmentsPage, setAssignmentsPage] = useState(1);

  const assignmentsQuery = useCustomQuery(
    "/api/roles/assignments/",
    ["permissions", "role-assignments"],
    {
      enabled,
      staleTime: Infinity,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  );

  const rolesQuery = useCustomQuery("/api/roles/", ["permissions", "roles"], {
    enabled,
  });

  const assignmentRows = useMemo(
    () => assignmentsListFromPayload(assignmentsQuery.data),
    [assignmentsQuery.data],
  );
  const roleOptions = useMemo(
    () => rolesListFromPayload(rolesQuery.data),
    [rolesQuery.data],
  );

  const assignRoleMutation = useMutation({
    mutationFn: ({ assignmentId, roleId }) =>
      patch(`/api/roles/assignments/${assignmentId}/`, { role: roleId }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["permissions", "role-assignments"],
        }),
        queryClient.invalidateQueries({ queryKey: ["permissions", "roles"] }),
      ]);
      toast.success("Role updated");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not update role"));
    },
  });

  const assignmentsTotalPages = Math.max(
    1,
    Math.ceil(assignmentRows.length / PAGE_SIZE),
  );
  const assignmentsCurrentPage = Math.min(
    assignmentsPage,
    assignmentsTotalPages,
  );
  const paginatedAssignments = useMemo(() => {
    const start = (assignmentsCurrentPage - 1) * PAGE_SIZE;
    return assignmentRows.slice(start, start + PAGE_SIZE);
  }, [assignmentRows, assignmentsCurrentPage]);

  const assignmentIdForRow = (row) =>
    row.assignment_id ?? row.assignmentId ?? row.id;

  if (assignmentsQuery.isLoading) {
    return <Spinner />;
  }

  if (assignmentsQuery.isError) {
    return (
      <ResourceLoadError
        error={assignmentsQuery.error}
        title="Assignments could not be loaded"
        onRefresh={() => assignmentsQuery.refetch()}
        refreshLabel="Try again"
      />
    );
  }

  if (assignmentRows.length === 0) {
    return (
      <Card
        className="padding-lg"
        style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}
      >
        No employee assignments returned from the server.
      </Card>
    );
  }

  const selectStyle = {
    width: "100%",
    maxWidth: "16rem",
    fontSize: "0.85rem",
    fontWeight: 400,
    padding: "0.4rem 0.5rem",
    borderRadius: "8px",
    border: "1px solid var(--color-border)",
    background: "var(--color-bg-card)",
    color: "var(--color-text-primary)",
    cursor: "pointer",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Card className="padding-none">
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "640px",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--color-bg-table-header)",
                  fontSize: "0.85rem",
                  color: "var(--color-text-muted)",
                }}
              >
                <th style={{ padding: "12px 1.5rem", textAlign: "left" }}>
                  Employee
                </th>
                <th style={{ padding: "12px 1rem", textAlign: "left" }}>
                  Department
                </th>
                <th style={{ padding: "12px 1rem", textAlign: "left" }}>
                  Current Role
                </th>
                <th style={{ padding: "12px 1.5rem", textAlign: "right" }}>
                  Modules
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedAssignments.map((row) => {
                const deptLabel = row.department_name ?? "—";
                const currentRoleId =
                  row.role?.id != null ? String(row.role.id) : "";
                const assignmentId = assignmentIdForRow(row);
                const rowKey =
                  assignmentId != null && assignmentId !== ""
                    ? String(assignmentId)
                    : `emp-${row.id}`;
                const rowBusy =
                  assignRoleMutation.isPending &&
                  String(assignRoleMutation.variables?.assignmentId) ===
                    String(assignmentId);
                const currentMissingFromList = Boolean(
                  currentRoleId &&
                  row.role?.name &&
                  !roleOptions.some((r) => String(r.id) === currentRoleId),
                );

                return (
                  <tr
                    key={rowKey}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <td style={{ padding: "12px 1.5rem" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        {row.image ? (
                          <img
                            src={row.image}
                            alt=""
                            style={{
                              width: "2rem",
                              height: "2rem",
                              borderRadius: "50%",
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "2rem",
                              height: "2rem",
                              borderRadius: "50%",
                              background:
                                "color-mix(in srgb, var(--color-primary-600) 16%, var(--color-bg-card))",
                              color: "var(--color-primary-600)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                              flexShrink: 0,
                            }}
                          >
                            {initialsFromFullName(row.name)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                            {row.name}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            {row.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "12px 1rem",
                        fontSize: "0.85rem",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {deptLabel}
                    </td>
                    <td
                      style={{ padding: "12px 1rem", verticalAlign: "middle" }}
                    >
                      <select
                        className="cursor-pointer"
                        style={{
                          ...selectStyle,
                          opacity: rowBusy || rolesQuery.isLoading ? 0.65 : 1,
                        }}
                        aria-label={`Role for ${row.name ?? "employee"}`}
                        value={currentRoleId}
                        disabled={
                          rowBusy ||
                          rolesQuery.isLoading ||
                          rolesQuery.isError ||
                          assignmentId == null ||
                          assignmentId === ""
                        }
                        onChange={(e) => {
                          const nextId = e.target.value;
                          if (
                            !nextId ||
                            nextId === currentRoleId ||
                            assignmentId == null ||
                            assignmentId === ""
                          )
                            return;
                          assignRoleMutation.mutate({
                            assignmentId,
                            roleId: nextId,
                          });
                        }}
                      >
                        {!currentRoleId && (
                          <option value="" disabled>
                            {rolesQuery.isLoading
                              ? "Loading roles…"
                              : "Select a role"}
                          </option>
                        )}
                        {currentMissingFromList && (
                          <option value={currentRoleId}>{row.role.name}</option>
                        )}
                        {roleOptions.map((r) => (
                          <option key={r.id} value={String(r.id)}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      {rolesQuery.isError && (
                        <div
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--color-error)",
                            marginTop: "0.25rem",
                          }}
                        >
                          Roles list failed to load
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px 1.5rem", textAlign: "right" }}>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          padding: "3px 10px",
                          borderRadius: "10px",
                          background:
                            (row.modules_count ?? 0) > 0
                              ? "color-mix(in srgb, var(--color-primary-600) 14%, var(--color-bg-card))"
                              : "var(--color-bg-subtle)",
                          color:
                            (row.modules_count ?? 0) > 0
                              ? "var(--color-primary-600)"
                              : "var(--color-text-secondary)",
                          fontWeight: 600,
                        }}
                      >
                        {row.modules_count ?? 0} module
                        {(row.modules_count ?? 0) !== 1 ? "s" : ""}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <Pagination
        currentPage={assignmentsCurrentPage}
        count={assignmentRows.length}
        onPageChange={setAssignmentsPage}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
};

export default PermissionsEmployeeAssignmentsTab;

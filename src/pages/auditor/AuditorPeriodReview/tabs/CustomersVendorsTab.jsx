import { useParams } from "react-router-dom";
import Card from "@/components/Shared/Card";
import Spinner from "@/core/Spinner";
import { useCustomersVendors } from "@/hooks/useCustomersVendors";

const CustomersVendorsTab = () => {
  const { periodId } = useParams();
  const { customers, vendors, isPending, isError, error } =
    useCustomersVendors(periodId);

  if (isPending) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <p style={{ color: "var(--color-danger)" }}>
          Failed to load customers &amp; vendors
          {error?.message ? `: ${error.message}` : "."}
        </p>
      </Card>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "1rem",
      }}
    >
      <Card className="padding-none">
        <div
          style={{
            padding: "0.75rem 1rem",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <h4 style={{ fontWeight: 700 }}>
            Customers ({customers.length})
          </h4>
        </div>
        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
          {customers.map((c) => (
            <div
              key={c.id}
              style={{
                padding: "0.5rem 1rem",
                borderBottom: "1px solid var(--color-border)",
                fontSize: "0.8rem",
              }}
            >
              <div style={{ fontWeight: 600 }}>{c.name}</div>
              <div
                style={{
                  color: "var(--color-text-muted)",
                  fontSize: "0.7rem",
                }}
              >
                {c.contact_person && <span>{c.contact_person} • </span>}
                {c.email} • {c.phone || "N/A"}
              </div>
            </div>
          ))}
          {customers.length === 0 && (
            <div style={{ padding: "1rem", color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
              No customers found.
            </div>
          )}
        </div>
      </Card>

      <Card className="padding-none">
        <div
          style={{
            padding: "0.75rem 1rem",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <h4 style={{ fontWeight: 700 }}>
            Vendors ({vendors.length})
          </h4>
        </div>
        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
          {vendors.map((v) => (
            <div
              key={v.id}
              style={{
                padding: "0.5rem 1rem",
                borderBottom: "1px solid var(--color-border)",
                fontSize: "0.8rem",
              }}
            >
              <div style={{ fontWeight: 600 }}>{v.name}</div>
              <div
                style={{
                  color: "var(--color-text-muted)",
                  fontSize: "0.7rem",
                }}
              >
                {v.contact_person && <span>{v.contact_person} • </span>}
                {v.email} • {v.phone || "N/A"}
              </div>
            </div>
          ))}
          {vendors.length === 0 && (
            <div style={{ padding: "1rem", color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
              No vendors found.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CustomersVendorsTab;

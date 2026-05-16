import { X, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useTranslation } from "react-i18next";

const ConfirmationModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  type = "warning",
  confirmText,
  cancelText,
  disabled = false,
}) => {
  const { t } = useTranslation("common");
  const resolvedConfirmText = confirmText ?? t("actions.confirm");
  const resolvedCancelText = cancelText ?? t("actions.cancel");

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <AlertTriangle size={24} color="var(--color-error)" />;
      case "success":
        return <CheckCircle size={24} color="var(--color-success)" />;
      case "info":
        return <Info size={24} color="var(--color-info)" />;
      default:
        return <AlertTriangle size={24} color="var(--color-warning)" />;
    }
  };

  const getHeaderColor = () => {
    switch (type) {
      case "danger":
        return "color-mix(in srgb, var(--color-error) 26%, var(--color-bg-surface))";
      case "success":
        return "color-mix(in srgb, var(--color-success) 26%, var(--color-bg-surface))";
      case "info":
        return "color-mix(in srgb, var(--color-info) 26%, var(--color-bg-surface))";
      default:
        return "color-mix(in srgb, var(--color-warning) 26%, var(--color-bg-surface))";
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        style={{
          background: "var(--color-bg-surface)",
          borderRadius: "var(--radius-lg)",
          width: "90%",
          maxWidth: "500px",
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
          animation: "fadeIn 0.2s ease-out",
          border: "1px solid var(--color-border)",
        }}
      >
        <div
          style={{
            padding: "1.25rem",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: getHeaderColor(),
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            {getIcon()}
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "var(--color-text-main)",
              }}
            >
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-secondary)",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            padding: "1.5rem",
            color: "var(--color-text-secondary)",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}
        >
          {message}
        </div>

        <div
          style={{
            padding: "1.25rem",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
            background: "var(--color-bg-subtle)",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-surface)",
              color: "var(--color-text-main)",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {resolvedCancelText}
          </button>
          <button
            disabled={disabled}
            onClick={onConfirm}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius-md)",
              border: "none",
              background:
                type === "danger"
                  ? "var(--color-error)"
                  : "var(--color-primary-600)",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 500,
            }}
            className={disabled ? "btn-disabled" : ""}
          >
            {resolvedConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

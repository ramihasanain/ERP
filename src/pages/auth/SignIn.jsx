import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AuthLayout from "@/components/app-layout/AuthLayout";
import Input from "@/components/Shared/Input";
import Button from "@/components/Shared/Button";
import {
  Mail,
  Lock,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  Building2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { errorToastOptions, successToastOptions } from "@/utils/toastOptions";
import { translateApiError } from "@/utils/translateApiError";

const BACKEND_ROOT_DOMAIN = "erp-api.site";

const SignIn = () => {
  const { t } = useTranslation(["auth", "common"]);
  const navigate = useNavigate();
  const { company } = useParams();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSignInAsAdmin = () => {
    localStorage.clear();
    navigate("/auth/signin", { replace: true });
  };

  const onSubmit = async (values) => {
    try {
      const role = company ? "employee" : "admin";
      const loginBaseUrl = company
        ? `https://${company}.${BACKEND_ROOT_DOMAIN}/api`
        : null;
      const user = await login(values.email, values.password, role, {
        loginBaseUrl,
      });
      toast.success(
        t("auth:signIn.welcomeBack", { name: user?.name || t("common:user") }),
        successToastOptions,
      );
      const roleName =
        typeof user.role === "string" ? user.role : user.role?.name;
      if (roleName === "admin" || roleName === "Admin") {
        navigate("/admin/dashboard");
      } else if (roleName === "Auditor") {
        navigate("/auditor/dashboard");
      } else if (user.reset_password_required) {
        navigate("/employee/reset-password-first-login");
      } else {
        navigate("/employee/dashboard");
      }
    } catch (err) {
      toast.error(
        translateApiError(err, "auth:signIn.failed"),
        errorToastOptions,
      );
    }
  };

  return (
    <AuthLayout
      title={t("auth:signIn.title")}
      subtitle={t("auth:signIn.subtitle")}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
      >
        <Controller
          name="email"
          control={control}
          rules={{ required: t("auth:signIn.emailRequired") }}
          render={({ field }) => (
            <Input
              {...field}
              label={t("auth:signIn.email")}
              type="email"
              placeholder={t("auth:signIn.emailPlaceholder")}
              startIcon={<Mail size={18} />}
              error={errors.email?.message}
              required
            />
          )}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Controller
            name="password"
            control={control}
            rules={{ required: t("auth:signIn.passwordRequired") }}
            render={({ field }) => (
              <Input
                {...field}
                label={t("auth:signIn.password")}
                type={showPassword ? "text" : "password"}
                placeholder={t("auth:signIn.passwordPlaceholder")}
                startIcon={<Lock size={18} />}
                endIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword
                        ? t("auth:signIn.hidePassword")
                        : t("auth:signIn.showPassword")
                    }
                    style={{
                      border: "none",
                      background: "transparent",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--color-text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                endIconInteractive
                error={errors.password?.message}
                required
              />
            )}
          />
          <div style={{ textAlign: "right" }}>
            <Link
              to="/auth/forgot-password"
              className="auth-inline-link"
              style={{
                fontSize: "0.875rem",
                color: "var(--color-primary-600)",
              }}
            >
              {t("auth:signIn.forgotPassword")}
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          isLoading={isLoading}
          icon={<ArrowRight size={18} />}
        >
          {t("auth:signIn.submit")}
        </Button>

        {company ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            fullWidth
            icon={<Building2 size={18} />}
            onClick={handleSignInAsAdmin}
            className="cursor-pointer"
          >
            {t("auth:signIn.signInAsAdmin")}
          </Button>
        ) : null}
      </form>

      <div
        style={{
          marginTop: "1.5rem",
          textAlign: "center",
          fontSize: "0.95rem",
        }}
      >
        {t("auth:signIn.noAccount")}{" "}
        <Link
          to="/auth/signup"
          className="auth-inline-link"
          style={{ color: "var(--color-primary-600)", fontWeight: 600 }}
        >
          {t("auth:signIn.createAccount")}
        </Link>
      </div>

      <div
        style={{
          marginTop: "1rem",
          textAlign: "center",
          padding: "0.75rem",
          borderRadius: "10px",
          background:
            "color-mix(in srgb, var(--color-primary-600) 14%, var(--color-bg-card))",
          border: "1px solid var(--color-border)",
        }}
      >
        <Link
          to="/auditor/login"
          className="auditor-link"
          style={{
            fontSize: "0.85rem",
            color: "var(--color-primary-500)",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            textDecoration: "none",
          }}
        >
          <Shield size={16} /> {t("auth:signIn.auditorPortal")}
        </Link>
      </div>
      <style>{`
        .auth-inline-link {
          text-decoration: none;
          transition: color 0.2s ease, opacity 0.2s ease;
        }
        .auth-inline-link:hover {
          color: var(--color-primary-700);
          opacity: 0.9;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .auditor-link {
          transition: transform 0.2s ease, color 0.2s ease;
        }
        .auditor-link:hover {
          transform: translateY(-1px);
          color: var(--color-primary-600);
        }
      `}</style>
    </AuthLayout>
  );
};

export default SignIn;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import Card from "@/components/Shared/Card";
import Button from "@/components/Shared/Button";
import Input from "@/components/Shared/Input";
import { Shield, LogIn, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { errorToastOptions, successToastOptions } from "@/utils/toastOptions";
import { translateApiError } from "@/utils/translateApiError";

const PUBLIC_API_URL = import.meta.env.VITE_API_BASE_URL;

const AuditorLogin = () => {
  const { t } = useTranslation(["auditor", "common"]);
  const navigate = useNavigate();
  const { persistLoginResponse } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(`${PUBLIC_API_URL}/login/`, {
        email: values.email,
        password: values.password,
      });
      const data = response.data;

      if (data.user?.reset_password_required) {
        toast.success(t("auditor:login.resetRequired"), successToastOptions);
        navigate("/auditor/reset-password-first-login", {
          replace: true,
          state: { accessToken: data.access },
        });
      } else {
        const user = persistLoginResponse(data, "Auditor", {
          loginBaseUrl: PUBLIC_API_URL,
        });
        toast.success(
          t("auditor:login.welcomeBack", {
            name: user?.name || t("auditor:login.defaultName"),
          }),
          successToastOptions,
        );
        navigate("/auditor/dashboard", { replace: true });
      }
    } catch (err) {
      toast.error(
        translateApiError(err, "auditor:login.failed"),
        errorToastOptions,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "2rem",
        }}
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <button
            onClick={() => navigate("/auth/signin")}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.85rem",
            }}
          >
            <ArrowLeft size={16} /> {t("auditor:login.backToMain")}
          </button>
        </div>

        <Card className="padding-lg" style={{ borderRadius: "16px" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div
              style={{
                width: "4rem",
                height: "4rem",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #1e3a5f, #3b82f6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
              }}
            >
              <Shield size={28} color="white" />
            </div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                marginBottom: "0.25rem",
              }}
            >
              {t("auditor:login.title")}
            </h1>
            <p
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "0.85rem",
              }}
            >
              {t("auditor:login.subtitle")}
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <Controller
              name="email"
              control={control}
              rules={{ required: t("auditor:login.emailRequired") }}
              render={({ field }) => (
                <Input
                  {...field}
                  label={t("auditor:login.email")}
                  type="email"
                  placeholder={t("auditor:login.emailPlaceholder")}
                  error={errors.email?.message}
                  required
                />
              )}
            />
            <Controller
              name="password"
              control={control}
              rules={{ required: t("auditor:login.passwordRequired") }}
              render={({ field }) => (
                <Input
                  {...field}
                  label={t("auditor:login.password")}
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auditor:login.passwordPlaceholder")}
                  endIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={
                        showPassword
                          ? t("auditor:login.hidePassword")
                          : t("auditor:login.showPassword")
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

            <Button
              type="submit"
              isLoading={isSubmitting}
              icon={<LogIn size={18} />}
              style={{ width: "100%", marginTop: "0.5rem" }}
            >
              {t("auditor:login.submit")}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AuditorLogin;

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/utils/apiErrorMessage";
import { errorToastOptions, successToastOptions } from "@/utils/toastOptions";
import {
  useClearAllNotifications,
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsQuery,
  useNotificationStatsQuery,
} from "@/hooks/useNotificationsApi";
import { subscribeToForegroundMessages } from "@/services/firebase";

const NotificationsContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context)
    throw new Error(
      "useNotifications must be used within NotificationsProvider",
    );
  return context;
};

const DEFAULT_NOTIFICATIONS = [
  {
    id: "N-001",
    type: "invoice",
    title: "New Invoice Created",
    message: "Invoice #INV-2025-042 has been created for ABC Corp ($5,200).",
    timestamp: "2025-03-05T14:30:00",
    read: false,
    icon: "📄",
    link: "/admin/accounting/invoices",
  },
  {
    id: "N-002",
    type: "leave",
    title: "Leave Request Pending",
    message: "Sarah Johnson submitted a vacation leave request (Mar 10-14).",
    timestamp: "2025-03-05T12:15:00",
    read: false,
    icon: "🏖️",
    link: "/admin/hr/requests",
  },
  {
    id: "N-003",
    type: "audit",
    title: "Audit Period Submitted",
    message:
      "January 2025 period has been submitted for audit to Deloitte Jordan.",
    timestamp: "2025-03-05T10:00:00",
    read: false,
    icon: "🛡️",
    link: "/admin/accounting/audit",
  },
  {
    id: "N-004",
    type: "payroll",
    title: "Payroll Ready for Review",
    message:
      "March 2025 payroll has been calculated. Total: $42,500. Ready for approval.",
    timestamp: "2025-03-04T16:45:00",
    read: false,
    icon: "💰",
    link: "/admin/hr/payroll",
  },
  {
    id: "N-005",
    type: "system",
    title: "New Employee Onboarded",
    message: "Omar Al-Hassan has been added to the Engineering department.",
    timestamp: "2025-03-04T09:30:00",
    read: true,
    icon: "👤",
    link: "/admin/hr/employees",
  },
  {
    id: "N-006",
    type: "inventory",
    title: "Low Stock Alert",
    message: "Printer Paper (A4) is below minimum stock level (15 remaining).",
    timestamp: "2025-03-03T15:20:00",
    read: true,
    icon: "📦",
    link: "/admin/inventory",
  },
  {
    id: "N-007",
    type: "payment",
    title: "Vendor Payment Due",
    message: "Payment to Office Supply Co. ($1,350) is due in 3 days.",
    timestamp: "2025-03-03T11:00:00",
    read: true,
    icon: "💳",
    link: "/admin/accounting/vendor-payments",
  },
  {
    id: "N-008",
    type: "approval",
    title: "Purchase Order Approved",
    message: "PO-2025-018 for IT Equipment has been approved by Finance.",
    timestamp: "2025-03-02T14:10:00",
    read: true,
    icon: "✅",
    link: "/admin/inventory/purchase-orders",
  },
  {
    id: "N-009",
    type: "contract",
    title: "Contract Expiring Soon",
    message: "Employment contract for Ahmad Khalil expires in 30 days.",
    timestamp: "2025-03-01T08:00:00",
    read: true,
    icon: "📋",
    link: "/admin/hr/employees",
  },
  {
    id: "N-010",
    type: "report",
    title: "Monthly Report Generated",
    message: "February 2025 Financial Report is ready for download.",
    timestamp: "2025-03-01T07:00:00",
    read: true,
    icon: "📊",
    link: "/admin/reports",
  },
];

const normalizeNotification = (raw) => {
  if (!raw || typeof raw !== "object") return null;

  const id =
    raw.id ??
    raw.pk ??
    raw.uuid ??
    raw.notification_id ??
    raw.notificationId ??
    null;

  const timestamp =
    raw.timestamp ??
    raw.created_at ??
    raw.createdAt ??
    raw.date ??
    raw.sent_at ??
    raw.sentAt ??
    new Date().toISOString();

  const read =
    raw.read ?? raw.is_read ?? raw.isRead ?? raw.seen ?? raw.is_seen ?? false;

  const title =
    raw.title ?? raw.subject ?? raw.heading ?? raw.name ?? "Notification";

  const message = raw.message ?? raw.body ?? raw.text ?? raw.description ?? "";

  const type = raw.type ?? raw.category ?? raw.kind ?? "system";

  const link =
    raw.link ??
    raw.url ??
    raw.path ??
    raw.click_action ??
    raw.clickAction ??
    null;

  const icon =
    raw.icon ??
    (type === "payment"
      ? "💳"
      : type === "inventory"
        ? "📦"
        : type === "audit"
          ? "🛡️"
          : "🔔");

  return {
    id: id != null ? String(id) : `N-${Date.now()}`,
    type: String(type || "system"),
    title: String(title || "Notification"),
    message: String(message || ""),
    timestamp: String(timestamp || new Date().toISOString()),
    read: Boolean(read),
    icon: String(icon || "🔔"),
    link: link ? String(link) : null,
    _raw: raw,
  };
};

export const NotificationsProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [localNotifications, setLocalNotifications] = useState([]);

  const enableApiQueries = isAuthenticated && user?.role !== "auditor";

  const notificationsQuery = useNotificationsQuery({
    enabled: enableApiQueries,
    refetchInterval: 60_000,
  });

  const statsQuery = useNotificationStatsQuery({
    enabled: enableApiQueries,
    refetchInterval: 60_000,
  });

  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteNotificationMutation = useDeleteNotification();
  const clearAllMutation = useClearAllNotifications();

  const baseNotifications = useMemo(() => {
    if (!isAuthenticated) return DEFAULT_NOTIFICATIONS;
    const data = notificationsQuery.data;
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data?.data)
          ? data.data
          : [];
    return list.map(normalizeNotification).filter(Boolean);
  }, [isAuthenticated, notificationsQuery.data]);

  const notifications = useMemo(() => {
    // Local items first (foreground FCM or optimistic adds), then backend list.
    const merged = [...localNotifications, ...baseNotifications];

    // De-dupe by id (local overrides backend)
    const seen = new Set();
    const deduped = [];
    for (const n of merged) {
      if (!n?.id) continue;
      if (seen.has(n.id)) continue;
      seen.add(n.id);
      deduped.push(n);
    }

    // Sort latest first when timestamps exist
    deduped.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    return deduped;
  }, [localNotifications, baseNotifications]);

  const unreadCount = useMemo(() => {
    if (isAuthenticated) {
      const s = statsQuery.data;
      const candidate =
        s?.unread_count ??
        s?.unreadCount ??
        s?.unread ??
        s?.data?.unread_count ??
        null;
      if (typeof candidate === "number") return candidate;
    }
    return notifications.filter((n) => !n.read).length;
  }, [isAuthenticated, statsQuery.data, notifications]);

  const addNotification = useCallback((notification) => {
    const normalized = normalizeNotification({
      ...notification,
      id: notification?.id ?? `N-${Date.now()}`,
      created_at: notification?.timestamp ?? new Date().toISOString(),
      is_read: notification?.read ?? false,
    });
    if (!normalized) return null;
    setLocalNotifications((prev) => [normalized, ...prev]);
    return normalized;
  }, []);

  const markAsRead = useCallback(
    (id) => {
      setLocalNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      if (isAuthenticated) {
        markReadMutation.mutate(
          { id, is_read: true },
          {
            onError: (e) => {
              toast.error(
                getApiErrorMessage(e, "Could not mark notification as read."),
                errorToastOptions,
              );
            },
          },
        );
      }
    },
    [isAuthenticated, markReadMutation],
  );

  const markAllAsRead = useCallback(() => {
    setLocalNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (isAuthenticated) {
      markAllReadMutation.mutate(
        {},
        {
          onSuccess: () =>
            toast.success(
              "All notifications marked as read.",
              successToastOptions,
            ),
          onError: (e) =>
            toast.error(
              getApiErrorMessage(e, "Could not mark all as read."),
              errorToastOptions,
            ),
        },
      );
    }
  }, [isAuthenticated, markAllReadMutation]);

  const deleteNotification = useCallback(
    (id) => {
      setLocalNotifications((prev) => prev.filter((n) => n.id !== id));
      if (isAuthenticated) {
        deleteNotificationMutation.mutate(id, {
          onError: (e) =>
            toast.error(
              getApiErrorMessage(e, "Could not delete notification."),
              errorToastOptions,
            ),
        });
      }
    },
    [isAuthenticated, deleteNotificationMutation],
  );

  const clearAll = useCallback(() => {
    setLocalNotifications([]);
    if (isAuthenticated) {
      clearAllMutation.mutate(undefined, {
        onSuccess: () =>
          toast.success("Notifications cleared.", successToastOptions),
        onError: (e) =>
          toast.error(
            getApiErrorMessage(e, "Could not clear notifications."),
            errorToastOptions,
          ),
      });
    }
  }, [isAuthenticated, clearAllMutation]);

  // Foreground FCM -> add to local list + toast
  const unsubRef = useRef(null);
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!isAuthenticated) return;
      const unsubscribe = await subscribeToForegroundMessages((payload) => {
        if (!alive) return;
        const title =
          payload?.notification?.title ||
          payload?.data?.title ||
          "Notification";
        const body = payload?.notification?.body || payload?.data?.body || "";
        const link = payload?.data?.click_action || payload?.data?.link || null;

        addNotification({
          type: payload?.data?.type || "system",
          title,
          message: body,
          icon: "🔔",
          link,
        });

        toast(title, { description: body, ...successToastOptions });
      });
      unsubRef.current = unsubscribe;
    })();

    return () => {
      alive = false;
      try {
        unsubRef.current?.();
      } catch {
        // ignore
      }
      unsubRef.current = null;
    };
  }, [isAuthenticated, addNotification]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

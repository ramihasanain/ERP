import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationsContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationsContext);
    if (!context) throw new Error('useNotifications must be used within NotificationsProvider');
    return context;
};

const DEFAULT_NOTIFICATIONS = [
    {
        id: 'N-001',
        type: 'invoice',
        title: 'New Invoice Created',
        message: 'Invoice #INV-2025-042 has been created for ABC Corp ($5,200).',
        timestamp: '2025-03-05T14:30:00',
        read: false,
        icon: '📄',
        link: '/admin/accounting/invoices'
    },
    {
        id: 'N-002',
        type: 'leave',
        title: 'Leave Request Pending',
        message: 'Sarah Johnson submitted a vacation leave request (Mar 10-14).',
        timestamp: '2025-03-05T12:15:00',
        read: false,
        icon: '🏖️',
        link: '/admin/hr/requests'
    },
    {
        id: 'N-003',
        type: 'audit',
        title: 'Audit Period Submitted',
        message: 'January 2025 period has been submitted for audit to Deloitte Jordan.',
        timestamp: '2025-03-05T10:00:00',
        read: false,
        icon: '🛡️',
        link: '/admin/accounting/audit'
    },
    {
        id: 'N-004',
        type: 'payroll',
        title: 'Payroll Ready for Review',
        message: 'March 2025 payroll has been calculated. Total: $42,500. Ready for approval.',
        timestamp: '2025-03-04T16:45:00',
        read: false,
        icon: '💰',
        link: '/admin/hr/payroll'
    },
    {
        id: 'N-005',
        type: 'system',
        title: 'New Employee Onboarded',
        message: 'Omar Al-Hassan has been added to the Engineering department.',
        timestamp: '2025-03-04T09:30:00',
        read: true,
        icon: '👤',
        link: '/admin/hr/employees'
    },
    {
        id: 'N-006',
        type: 'inventory',
        title: 'Low Stock Alert',
        message: 'Printer Paper (A4) is below minimum stock level (15 remaining).',
        timestamp: '2025-03-03T15:20:00',
        read: true,
        icon: '📦',
        link: '/admin/inventory'
    },
    {
        id: 'N-007',
        type: 'payment',
        title: 'Vendor Payment Due',
        message: 'Payment to Office Supply Co. ($1,350) is due in 3 days.',
        timestamp: '2025-03-03T11:00:00',
        read: true,
        icon: '💳',
        link: '/admin/accounting/vendor-payments'
    },
    {
        id: 'N-008',
        type: 'approval',
        title: 'Purchase Order Approved',
        message: 'PO-2025-018 for IT Equipment has been approved by Finance.',
        timestamp: '2025-03-02T14:10:00',
        read: true,
        icon: '✅',
        link: '/admin/inventory/purchase-orders'
    },
    {
        id: 'N-009',
        type: 'contract',
        title: 'Contract Expiring Soon',
        message: 'Employment contract for Ahmad Khalil expires in 30 days.',
        timestamp: '2025-03-01T08:00:00',
        read: true,
        icon: '📋',
        link: '/admin/hr/employees'
    },
    {
        id: 'N-010',
        type: 'report',
        title: 'Monthly Report Generated',
        message: 'February 2025 Financial Report is ready for download.',
        timestamp: '2025-03-01T07:00:00',
        read: true,
        icon: '📊',
        link: '/admin/reports'
    }
];

export const NotificationsProvider = ({ children }) => {
    const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);

    const unreadCount = notifications.filter(n => !n.read).length;

    const addNotification = useCallback((notification) => {
        const newNotif = {
            ...notification,
            id: `N-${Date.now()}`,
            timestamp: new Date().toISOString(),
            read: false
        };
        setNotifications(prev => [newNotif, ...prev]);
        return newNotif;
    }, []);

    const markAsRead = useCallback((id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const deleteNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    return (
        <NotificationsContext.Provider value={{
            notifications,
            unreadCount,
            addNotification,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            clearAll
        }}>
            {children}
        </NotificationsContext.Provider>
    );
};

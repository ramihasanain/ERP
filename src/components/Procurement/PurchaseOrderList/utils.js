export const STATUS_UI_TO_API_MAP = {
    Draft: 'draft',
    'Pending Approval': 'pending_approval',
    Approved: 'approved',
    Rejected: 'rejected',
    Closed: 'closed',
};

export const STATUS_FILTERS = ['All', 'Draft', 'Pending Approval', 'Approved', 'Rejected'];

export const normalizePurchaseOrdersResponse = (response) => {
    const orders = Array.isArray(response?.data) ? response.data : [];
    return orders.map((order) => ({
        id: order.id,
        number: order.number || '-',
        vendorName: order.vendor_name || '-',
        orderDate: order.order_date || '-',
        expectedDate: order.expected_date || '-',
        currency: order.currency || 'JOD',
        status: order.status_display || order.status || '-',
        totalAmount: Number(order.total_amount ?? 0),
    }));
};

export const getStatusColor = (status) => {
    switch (status) {
        case 'Draft':
            return 'var(--color-slate-500)';
        case 'Pending Approval':
            return 'var(--color-warning)';
        case 'Approved':
            return 'var(--color-success)';
        case 'Rejected':
            return 'var(--color-danger)';
        case 'Closed':
            return 'var(--color-primary-700)';
        default:
            return 'var(--color-text-main)';
    }
};

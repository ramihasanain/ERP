export const normalizeArrayResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data)) return response.data;
    return [];
};

export const normalizeOrderDetails = (order) => ({
    id: order?.id || '',
    number: order?.number || '',
    vendorId: order?.vendor_id || '',
    vendorName: order?.vendor_name || '',
    orderDate: order?.order_date || '',
    expectedDate: order?.expected_date || '',
    currency: order?.currency || 'JOD',
    status: order?.status_display || order?.status || '',
    lines: Array.isArray(order?.lines)
        ? order.lines.map((line) => ({
            id: line.id,
            productId: line.product_id || '',
            productName: line.product_name || '',
            productSku: line.product_sku || '',
            quantity: Number(line.quantity ?? 1),
            unitPrice: Number(line.unit_price ?? 0),
            totalCost: Number(line.total_cost ?? 0),
        }))
        : [],
});

export const normalizeVendor = (vendor) => ({
    id: vendor?.id || vendor?.uuid || '',
    name: vendor?.name || vendor?.vendor_name || 'Unnamed vendor',
});

export const normalizeProduct = (product) => ({
    id: product?.id || product?.uuid || '',
    name: product?.name || product?.product_name || 'Unnamed item',
    sku: product?.sku || product?.product_sku || '',
    unitPrice: Number(product?.cost_price ?? product?.purchasePrice ?? product?.purchase_price ?? 0),
});

export const emptyLine = () => ({
    productId: '',
    quantity: 1,
    unitPrice: 0,
    totalCost: 0,
});

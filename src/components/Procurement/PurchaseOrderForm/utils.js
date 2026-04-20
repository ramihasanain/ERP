export const normalizeVendorsResponse = (response) => {
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response)) return response;
    return [];
};

export const normalizeProductsResponse = (response) => {
    const products = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.results)
            ? response.results
            : Array.isArray(response)
                ? response
                : [];

    return products.map((product) => ({
        id: product?.id || '',
        name: product?.name || 'Unnamed item',
        sku: product?.sku || '',
        type: product?.type || '',
        unitCost: Number(product?.cost_price ?? 0),
    }));
};

export const defaultFormData = {
    vendorId: '',
    date: new Date().toISOString().split('T')[0],
    expectedDate: '',
    notes: '',
};

export const emptyLineItem = {
    itemId: '',
    quantity: 1,
    unitCost: 0,
    totalCost: 0,
};

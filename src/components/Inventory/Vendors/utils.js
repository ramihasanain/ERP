export const normalizeArrayResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data)) return response.data;
    return [];
};

export const normalizeVendor = (item) => ({
    id: item?.id || '',
    name: item?.name || '',
    taxId: item?.tax_id || '',
    website: item?.website || '',
    contactPerson: item?.contact_person || '',
    email: item?.email || '',
    phone: item?.phone || '',
    address: item?.address || '',
    paymentTerms: item?.payment_terms || '',
    paymentTermsDisplay: item?.payment_terms_display || '',
    isActive: Boolean(item?.is_active),
});

export const normalizeVendors = (response) => normalizeArrayResponse(response).map(normalizeVendor);

export const normalizeVendorsResponse = (response) => ({
    count: Number.isFinite(response?.count) ? response.count : normalizeArrayResponse(response).length,
    vendors: normalizeArrayResponse(response).map(normalizeVendor),
});

export const getPaymentTermsLabel = (value) => {
    if (!value) return '--';
    return value.replaceAll('_', ' ').replace(/\b\w/g, (match) => match.toUpperCase());
};

export const vendorDefaultValues = {
    name: '',
    tax_id: '',
    website: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    payment_terms: 'net_15',
    is_active: true,
};

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBasePath } from '@/hooks/useBasePath';
import { toast } from 'sonner';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Save, ArrowLeft, Building2, User, Phone, MapPin } from 'lucide-react';
import { useCustomPost } from '@/hooks/useMutation';
import SelectWithLoadMore from '@/core/SelectWithLoadMore';
import { useCurrenciesInfiniteQuery } from '@/hooks/useCurrenciesInfiniteQuery';

const AddCustomer = () => {
    const navigate = useNavigate();
    const basePath = useBasePath();
    const currenciesQuery = useCurrenciesInfiniteQuery();
    const createCustomerMutation = useCustomPost('/api/sales/customers/create/', [['sales-customers']]);

    const [formData, setFormData] = useState({
        name: '',
        tax_id: '',
        currency: '',
        contact_person: '',
        phone: '',
        email: '',
        billing_address: '',
    });

    const isFormValid = useMemo(
        () => Boolean(formData.name.trim()) && Boolean(formData.currency) && Boolean(formData.contact_person.trim()),
        [formData]
    );

    const currencies = useMemo(() => {
        const seen = new Set();
        const out = [];
        for (const page of currenciesQuery.data?.pages ?? []) {
            const list = page?.data?.results ?? page?.data ?? page?.results ?? page;
            if (!Array.isArray(list)) continue;
            for (const item of list) {
                const id = String(item?.uuid ?? item?.id ?? '');
                if (!id || seen.has(id)) continue;
                seen.add(id);
                out.push(item);
            }
        }
        return out;
    }, [currenciesQuery.data]);

    const currencySelectOptions = useMemo(() => {
        const base = currencies.map((currency) => ({
            value: String(currency?.uuid ?? currency?.id ?? ''),
            label: `${currency?.code || ''} - ${currency?.name || ''}`.trim(),
        })).filter((opt) => opt.value);

        if (formData.currency && !base.some((o) => o.value === formData.currency)) {
            return [{ value: formData.currency, label: formData.currency }, ...base];
        }

        return base;
    }, [currencies, formData.currency]);

    const selectedCurrency = useMemo(() => {
        if (!formData.currency) return null;
        const selectedId = String(formData.currency);
        return (
            currencies.find((currency) => String(currency?.uuid ?? currency?.id ?? '') === selectedId) ?? null
        );
    }, [currencies, formData.currency]);

    const {
        isLoading: currenciesInitialLoading,
        hasNextPage: currenciesHasNextPage,
        fetchNextPage: fetchNextCurrenciesPage,
        isFetchingNextPage: isFetchingNextCurrenciesPage,
        isFetchNextPageError: isFetchNextCurrenciesPageError,
        isError: currenciesFailed,
    } = currenciesQuery;

    const handleSubmit = async () => {
        if (!isFormValid) return;

        const payload = {
            name: formData.name.trim(),
            tax_id: formData.tax_id.trim(),
            contact_person: formData.contact_person.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim(),
            billing_address: formData.billing_address.trim(),
            currency: formData.currency,
            currency_code: selectedCurrency?.code || selectedCurrency?.currency_code || '',
            is_active: true,
        };

        try {
            await createCustomerMutation.mutateAsync(payload);
            toast.success('Customer created successfully.');
            navigate(-1);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to create customer.');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Button
                    variant="ghost"
                    icon={<ArrowLeft size={18} />}
                    onClick={() => navigate(`${basePath}/accounting`)}
                    className="cursor-pointer shrink-0"
                />
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Add New Customer</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Create a new client profile.</p>
                </div>
            </div>

            <Card className="padding-lg">
                <div className="grid grid-cols-2 gap-8 max-[900px]:grid-cols-1">
                    <div className="flex flex-col gap-6">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Building2 size={20} color="var(--color-primary-600)" />
                            Customer Details
                        </h3>
                        <Input
                            label="Customer / Company Name"
                            placeholder="e.g. Acme Corp"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                        <Input
                            label="Tax ID"
                            placeholder="TAX-123456"
                            value={formData.tax_id}
                            onChange={e => setFormData({ ...formData, tax_id: e.target.value })}
                        />
                        <Input
                            startIcon={<MapPin size={16} />}
                            label="Billing Address"
                            placeholder="Street, City, Country"
                            value={formData.billing_address}
                            onChange={e => setFormData({ ...formData, billing_address: e.target.value })}
                        />
                    </div>

                    <div className="flex flex-col gap-6">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <User size={20} color="var(--color-primary-600)" />
                            Contact Information
                        </h3>
                        <Input
                            label="Contact Person"
                            placeholder="Name"
                            value={formData.contact_person}
                            onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                        />
                        <Input
                            startIcon={<Phone size={16} />}
                            label="Phone Number"
                            placeholder="+1..."
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                        <Input
                            label="Email Address"
                            placeholder="client@email.com"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="col-span-2 max-[900px]:col-span-1">
                        <SelectWithLoadMore
                            id="add-customer-currency"
                            label="Currency"
                            value={formData.currency}
                            onChange={(nextValue) => setFormData((prev) => ({ ...prev, currency: nextValue || '' }))}
                            options={currencySelectOptions}
                            emptyOptionLabel={currenciesInitialLoading ? 'Loading currencies...' : 'Select currency...'}
                            disabled={currenciesFailed}
                            isInitialLoading={currenciesInitialLoading && !currenciesQuery.data}
                            hasMore={Boolean(currenciesHasNextPage) && !currenciesFailed}
                            onLoadMore={() => fetchNextCurrenciesPage()}
                            isLoadingMore={isFetchingNextCurrenciesPage}
                            paginationError={
                                isFetchNextCurrenciesPageError
                                    ? 'Could not load more currencies. Scroll down to retry.'
                                    : null
                            }
                            zIndex={1400}
                        />
                    </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '2rem', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
                    <Button
                        icon={<Save size={18} />}
                        onClick={handleSubmit}
                        disabled={!isFormValid || createCustomerMutation.isPending}
                    >
                        {createCustomerMutation.isPending ? 'Saving...' : 'Save Customer'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default AddCustomer;

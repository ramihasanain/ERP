import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Save, ArrowLeft, Building2, User, Phone, MapPin } from 'lucide-react';
import useCustomQuery from '@/hooks/useQuery';
import { useCustomPost } from '@/hooks/useMutation';

const AddCustomer = () => {
    const navigate = useNavigate();
    const currenciesQuery = useCustomQuery('/api/shared/currencies/', ['shared-currencies'], {
        select: (response) => {
            if (Array.isArray(response?.data)) return response.data;
            if (Array.isArray(response?.results)) return response.results;
            if (Array.isArray(response)) return response;
            return [];
        },
    });
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

    const currencyOptions = useMemo(() => currenciesQuery.data ?? [], [currenciesQuery.data]);
    const isFormValid = useMemo(
        () => Boolean(formData.name.trim()) && Boolean(formData.currency) && Boolean(formData.contact_person.trim()),
        [formData]
    );

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
                <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate(-1)}>Back</Button>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Add New Customer</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Create a new client profile.</p>
                </div>
            </div>

            <Card className="padding-lg">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Currency</label>
                            <select
                                value={formData.currency}
                                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                                disabled={currenciesQuery.isPending}
                            >
                                <option value="">{currenciesQuery.isPending ? 'Loading currencies...' : 'Select currency...'}</option>
                                {currencyOptions.map((currency) => (
                                    <option key={currency.id} value={currency.id}>
                                        {currency.code} - {currency.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                        <Input
                            startIcon={<MapPin size={16} />}
                            label="Billing Address"
                            placeholder="Street, City, Country"
                            value={formData.billing_address}
                            onChange={e => setFormData({ ...formData, billing_address: e.target.value })}
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

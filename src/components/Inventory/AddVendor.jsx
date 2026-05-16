import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Save, ArrowLeft, Building2, User, Phone, MapPin } from 'lucide-react';

const AddVendor = () => {
    const { t } = useTranslation(['inventory', 'common']);
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate(-1)}>{t('common:actions.back')}</Button>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{t('addVendor.title')}</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>{t('addVendor.subtitle')}</p>
                </div>
            </div>

            <Card className="padding-lg">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Building2 size={20} color="var(--color-primary-600)" />
                            Company Details
                        </h3>
                        <Input label="Company Name" placeholder="e.g. Acme Corp" />
                        <Input label="Tax ID / VAT Number" placeholder="TAX-123456" />
                        <Input label="Website" placeholder="https://" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Payment Terms</label>
                            <select style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                <option>Net 15</option>
                                <option>Net 30</option>
                                <option>Net 60</option>
                                <option>Due on Receipt</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <User size={20} color="var(--color-primary-600)" />
                            Contact Information
                        </h3>
                        <Input label="Contact Person" placeholder="Name" />
                        <Input startIcon={<Phone size={16} />} label="Phone Number" placeholder="+1..." />
                        <Input label="Email Address" placeholder="vendor@email.com" />
                        <Input startIcon={<MapPin size={16} />} label="Address" placeholder="Street, City, Country" />
                    </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '2rem', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <Button variant="ghost" onClick={() => navigate(-1)}>{t('common:actions.cancel')}</Button>
                    <Button icon={<Save size={18} />}>{t('addVendor.saveVendor')}</Button>
                </div>
            </Card>
        </div>
    );
};

export default AddVendor;

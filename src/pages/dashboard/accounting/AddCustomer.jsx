import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { Save, ArrowLeft, Building2, User, Phone, MapPin } from 'lucide-react';

const AddCustomer = () => {
    const navigate = useNavigate();

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
                        <Input label="Customer / Company Name" placeholder="e.g. Acme Corp" />
                        <Input label="Tax ID" placeholder="TAX-123456" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Currency</label>
                            <select style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                <option>USD - US Dollar</option>
                                <option>JOD - Jordanian Dinar</option>
                                <option>EUR - Euro</option>
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
                        <Input label="Email Address" placeholder="client@email.com" />
                        <Input startIcon={<MapPin size={16} />} label="Billing Address" placeholder="Street, City, Country" />
                    </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '2rem', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
                    <Button icon={<Save size={18} />}>Save Customer</Button>
                </div>
            </Card>
        </div>
    );
};

export default AddCustomer;

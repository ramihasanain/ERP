import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { Save, ArrowLeft, Monitor } from 'lucide-react';

import { useCategories } from '../../../context/CategoryContext';

const RegisterAsset = () => {
    const navigate = useNavigate();
    const { categories } = useCategories();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate(-1)}>Back</Button>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Register Asset</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Add a new fixed asset to the register.</p>
                </div>
            </div>

            <Card className="padding-lg">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Asset Info</h3>
                        <Input label="Asset Name" placeholder="e.g., MacBook Pro M3" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Category</label>
                            <select style={{ height: '2.5rem', padding: '0 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                <option value="">Select Asset Category...</option>
                                {categories['Fixed Assets']?.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <Input label="Serial Number" placeholder="Optional" />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Financials</h3>
                        <Input label="Purchase Date" type="date" />
                        <Input label="Purchase Cost" type="number" placeholder="0.00" />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Input label="Life (Years)" type="number" defaultValue="5" />
                            <Input label="Salvage Value" type="number" defaultValue="0" />
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
                    <Button icon={<Save size={18} />}>Register Asset</Button>
                </div>
            </Card>
        </div>
    );
};

export default RegisterAsset;

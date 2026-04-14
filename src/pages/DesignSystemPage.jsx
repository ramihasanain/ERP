import React, { useState } from 'react';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Mail, Lock, Search, Plus, Trash, Save } from 'lucide-react';

const DesignSystemPage = () => {
    const [loading, setLoading] = useState(false);

    const toggleLoad = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 2000);
    };

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <header style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Design System</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Core components and style guide for UnifiedCore.
                </p>
            </header>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Buttons</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Variants */}
                    <div>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--color-text-muted)' }}>Variants</h3>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <Button>Primary</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="outline">Outline</Button>
                            <Button variant="ghost">Ghost</Button>
                            <Button variant="danger">Danger</Button>
                        </div>
                    </div>

                    {/* Sizes */}
                    <div>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--color-text-muted)' }}>Sizes</h3>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Button size="sm">Small</Button>
                            <Button size="md">Medium</Button>
                            <Button size="lg">Large</Button>
                        </div>
                    </div>

                    {/* States */}
                    <div>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--color-text-muted)' }}>States & Icons</h3>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <Button disabled>Disabled</Button>
                            <Button isLoading={loading} onClick={toggleLoad}>Click to Load</Button>
                            <Button icon={<Plus size={18} />}>Add New</Button>
                            <Button variant="secondary" icon={<Save size={18} />}>Save</Button>
                            <Button variant="danger" icon={<Trash size={18} />} />
                        </div>
                    </div>
                </div>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Inputs</h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                    <Input label="Email Address" placeholder="you@company.com" startIcon={<Mail size={18} />} />
                    <Input label="Password" type="password" placeholder="••••••••" startIcon={<Lock size={18} />} />
                    <Input label="Search" placeholder="Search..." endIcon={<Search size={18} />} />
                    <Input label="Disabled Input" disabled value="Cannot change this" />
                    <Input label="Error State" error="This field is required" placeholder="Missing value" />
                </div>
            </section>

            <section>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Colors</h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((step) => (
                        <div key={step} style={{ textAlign: 'center' }}>
                            <div style={{
                                width: '3rem',
                                height: '3rem',
                                backgroundColor: `var(--color-primary-${step})`,
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '0.5rem',
                                boxShadow: 'var(--shadow-sm)'
                            }} />
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{step}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default DesignSystemPage;

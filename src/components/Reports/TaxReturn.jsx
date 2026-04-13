import React from 'react';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { Download, Calendar, FileCheck } from 'lucide-react';

const TaxReturn = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Tax Return (VAT/GST)</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Tax liability report for government filing.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="outline" icon={<Calendar size={16} />}>Q1 2026</Button>
                    <Button variant="outline" icon={<Download size={16} />}>Export PDF</Button>
                </div>
            </div>

            <Card className="padding-lg">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '1rem', background: 'var(--color-blue-50)', borderRadius: 'var(--radius-md)', color: 'var(--color-blue-700)' }}>
                    <FileCheck size={24} />
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Ready for Filing</h3>
                        <p style={{ fontSize: '0.85rem' }}>All transactions for this period have been reconciled.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Sales Tax */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>1. Sales (Output Tax)</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Total Sales (Excl. Tax)</span>
                            <span>$125,000.00</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 600 }}>
                            <span>VAT Collected (16%)</span>
                            <span style={{ color: 'var(--color-text-main)' }}>$20,000.00</span>
                        </div>
                    </div>

                    {/* Purchases Tax */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>2. Purchases (Input Tax)</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Total Purchases (Excl. Tax)</span>
                            <span>$72,500.00</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 600 }}>
                            <span>VAT Paid (Reclaimable)</span>
                            <span style={{ color: 'var(--color-text-main)' }}>$11,600.00</span>
                        </div>
                    </div>

                    {/* Net Payable */}
                    <div style={{ marginTop: '1rem', padding: '1.5rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Net Tax Payable</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-error)' }}>$8,400.00</span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', textAlign: 'right' }}>Due by Apr 15, 2026</p>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <Button variant="ghost">Mark as Filed</Button>
                    <Button>File Return Now</Button>
                </div>
            </Card>
        </div>
    );
};

export default TaxReturn;

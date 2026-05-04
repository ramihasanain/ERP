import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '@/components/Shared/Card';
import Button from '@/components/Shared/Button';
import { ArrowLeft, Printer, Download, Mail, CheckCircle, Share2 } from 'lucide-react';

const InvoicePreview = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    // Mock data for the preview
    const invoice = {
        id: id || 'INV-2025-003',
        date: 'Feb 08, 2026',
        dueDate: 'Feb 22, 2026',
        status: 'Unpaid',
        client: {
            name: 'Tech Solutions Ltd.',
            address: '45 Silicon Valley Blvd, Palo Alto, CA 94043',
            email: 'billing@techsol.com'
        },
        company: {
            name: 'UnifiedCore Systems',
            address: '123 Innovation Drive, Tech City, TC 90210',
            email: 'finance@unifiedcore.com',
            phone: '+1 (555) 000-1234'
        },
        items: [
            { id: 1, description: 'Enterprise Software License (Annual)', qty: 1, price: 4500.00, total: 4500.00 },
            { id: 2, description: 'Implementation & Onboarding Service', qty: 1, price: 1200.00, total: 1200.00 },
            { id: 3, description: 'Custom Feature Development (Hours)', qty: 15, price: 150.00, total: 2250.00 },
        ],
        subtotal: 7950.00,
        taxRate: 10,
        taxAmount: 795.00,
        total: 8745.00
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button
                    variant="ghost"
                    icon={<ArrowLeft size={18} />}
                    onClick={() => navigate('/admin/accounting')}
                    className="cursor-pointer shrink-0"
                />
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Button variant="outline" icon={<Printer size={16} />}>Print</Button>
                    <Button variant="outline" icon={<Download size={16} />}>Download</Button>
                    <Button icon={<Mail size={16} />}>Send Invoice</Button>
                </div>
            </div>

            <Card className="padding-none" style={{ overflow: 'hidden' }}>
                {/* Status Banner */}
                <div style={{ background: 'var(--color-bg-subtle)', padding: '1rem 2rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Status:</span>
                        <span style={{
                            background: 'var(--color-warning-dim)',
                            color: 'var(--color-warning)',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '1rem',
                            fontSize: '0.85rem',
                            fontWeight: 600
                        }}>
                            {invoice.status}
                        </span>
                    </div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                        Due in 14 days
                    </div>
                </div>

                <div style={{ padding: '3rem' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem' }}>
                        <div>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-400))',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 800,
                                fontSize: '1.5rem',
                                marginBottom: '1rem'
                            }}>
                                U
                            </div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{invoice.company.name}</h1>
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: '1.5' }}>
                                {invoice.company.address}<br />
                                {invoice.company.email}<br />
                                {invoice.company.phone}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-slate-200)', letterSpacing: '-0.02em', margin: 0 }}>INVOICE</h2>
                            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-main)', marginTop: '0.5rem' }}>#{invoice.id}</div>
                            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                    <span style={{ display: 'inline-block', width: '80px' }}>Date:</span>
                                    <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{invoice.date}</span>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                    <span style={{ display: 'inline-block', width: '80px' }}>Due Date:</span>
                                    <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{invoice.dueDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bill To */}
                    <div style={{ marginBottom: '3rem', padding: '1.5rem', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                        <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Bill To</h3>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>{invoice.client.name}</div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                            {invoice.client.address}<br />
                            {invoice.client.email}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div style={{ marginBottom: '2rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                                    <th style={{ textAlign: 'left', padding: '1rem 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Description</th>
                                    <th style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', width: '100px' }}>Qty</th>
                                    <th style={{ textAlign: 'right', padding: '1rem 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', width: '150px' }}>Price</th>
                                    <th style={{ textAlign: 'right', padding: '1rem 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', width: '150px' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items.map((item) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '1.25rem 0', fontWeight: 500, color: 'var(--color-text-main)' }}>{item.description}</td>
                                        <td style={{ padding: '1.25rem 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>{item.qty}</td>
                                        <td style={{ padding: '1.25rem 0', textAlign: 'right', color: 'var(--color-text-secondary)' }}>${item.price.toFixed(2)}</td>
                                        <td style={{ padding: '1.25rem 0', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-main)' }}>${item.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ width: '300px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                <span>Subtotal</span>
                                <span style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>${invoice.subtotal.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                                <span>Tax ({invoice.taxRate}%)</span>
                                <span style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>${invoice.taxAmount.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text-main)' }}>Total Due</span>
                                <span style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-primary-600)' }}>${invoice.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Thank you for your business!</p>
                        <p>Please make checks payable to <strong>{invoice.company.name}</strong>. Payment is due within 14 days.</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default InvoicePreview;

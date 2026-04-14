import React from 'react';

const Footer = () => {
    return (
        <footer style={{ background: 'var(--color-slate-900)', color: 'var(--color-slate-300)', padding: '4rem 0 2rem' }}>
            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
                    <div>
                        <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>UnifiedCore</h3>
                        <p style={{ lineHeight: 1.6 }}>
                            The complete operating system for modern global businesses.
                        </p>
                    </div>

                    <div>
                        <h4 style={{ color: 'white', fontWeight: 600, marginBottom: '1rem' }}>Product</h4>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <li>Accounting</li>
                            <li>HR & Payroll</li>
                            <li>Inventory</li>
                            <li>Integrations</li>
                        </ul>
                    </div>

                    <div>
                        <h4 style={{ color: 'white', fontWeight: 600, marginBottom: '1rem' }}>Resources</h4>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <li>Documentation</li>
                            <li>API Reference</li>
                            <li>Blog</li>
                            <li>Community</li>
                        </ul>
                    </div>

                    <div>
                        <h4 style={{ color: 'white', fontWeight: 600, marginBottom: '1rem' }}>Legal</h4>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <li>Privacy Policy</li>
                            <li>Terms of Service</li>
                            <li>Security</li>
                        </ul>
                    </div>
                </div>

                <div style={{ paddingTop: '2rem', borderTop: '1px solid var(--color-slate-800)', textAlign: 'center', fontSize: '0.875rem' }}>
                    &copy; {new Date().getFullYear()} UnifiedCore. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;

import React from 'react';
import Card from '@/components/Shared/Card';
import SkeletonBlock from './SkeletonBlock';

const MyContractSkeleton = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <SkeletonBlock height={26} width={200} />
                <div style={{ marginTop: '0.65rem' }}>
                    <SkeletonBlock height={14} width={340} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {[0, 1, 2, 3].map((i) => (
                    <Card key={i} className="padding-md">
                        <SkeletonBlock height={12} width={120} />
                        <div style={{ marginTop: '0.65rem' }}>
                            <SkeletonBlock height={18} width={150} />
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="padding-lg">
                <SkeletonBlock height={18} width={220} />
                <div style={{ marginTop: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                            <SkeletonBlock height={10} width={110} />
                            <div style={{ marginTop: '0.65rem' }}>
                                <SkeletonBlock height={18} width={150} />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Card className="padding-lg">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <SkeletonBlock height={40} width={40} radius={12} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <SkeletonBlock height={16} width={220} />
                        <SkeletonBlock height={12} width={180} />
                    </div>
                </div>
                <SkeletonBlock height={220} width="100%" radius={10} />
            </Card>

            <Card className="padding-lg">
                <SkeletonBlock height={18} width={200} />
                <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {[0, 1].map((i) => (
                        <div key={i} style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                            <SkeletonBlock height={10} width={110} />
                            <div style={{ marginTop: '0.65rem' }}>
                                <SkeletonBlock height={20} width={90} />
                            </div>
                            <div style={{ marginTop: '0.35rem' }}>
                                <SkeletonBlock height={10} width={120} />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default MyContractSkeleton;


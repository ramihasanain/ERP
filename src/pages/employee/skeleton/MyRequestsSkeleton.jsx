import React from 'react';
import Card from '@/components/Shared/Card';
import SkeletonBlock from './SkeletonBlock';

const MyRequestsSkeleton = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <SkeletonBlock height={26} width={200} />
                    <SkeletonBlock height={14} width={340} />
                </div>
                <SkeletonBlock height={40} width={150} radius={12} />
            </div>

            <Card className="padding-none" style={{ overflowX: 'auto' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                    <SkeletonBlock height={14} width={220} />
                </div>
                <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1.2fr 1fr 1fr 0.8fr 140px',
                                gap: '0.85rem',
                                alignItems: 'center',
                            }}
                        >
                            <SkeletonBlock height={14} width="85%" />
                            <SkeletonBlock height={14} width="70%" />
                            <SkeletonBlock height={14} width="80%" />
                            <SkeletonBlock height={22} width={90} radius={999} />
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <SkeletonBlock height={28} width={90} radius={10} />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default MyRequestsSkeleton;


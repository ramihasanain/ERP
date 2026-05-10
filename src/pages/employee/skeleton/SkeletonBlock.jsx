import React from 'react';

const shimmerKeyframes = `
@keyframes skeletonShimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
`;

const SkeletonBlock = ({
    width = '100%',
    height = 14,
    radius = 10,
    style,
    className,
    'aria-label': ariaLabel = 'Loading',
}) => {
    return (
        <>
            <div
                className={className}
                aria-label={ariaLabel}
                aria-busy="true"
                style={{
                    width,
                    height: typeof height === 'number' ? `${height}px` : height,
                    borderRadius: typeof radius === 'number' ? `${radius}px` : radius,
                    backgroundImage:
                        'linear-gradient(90deg, var(--color-slate-100), var(--color-slate-50), var(--color-slate-100))',
                    backgroundSize: '400px 100%',
                    animation: 'skeletonShimmer 1.2s ease-in-out infinite',
                    ...style,
                }}
            />
            <style>{shimmerKeyframes}</style>
        </>
    );
};

export default SkeletonBlock;


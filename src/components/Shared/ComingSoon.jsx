import React from 'react';
import { Construction, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Shared/Button';

const ComingSoon = ({ title = "Under Construction", message = "This feature is currently being developed." }) => {
    const navigate = useNavigate();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            textAlign: 'center',
            gap: '1.5rem',
            color: 'var(--color-text-secondary)'
        }}>
            <div style={{
                width: '4rem',
                height: '4rem',
                background: 'var(--color-slate-100)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary-600)'
            }}>
                <Construction size={32} />
            </div>
            <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>{title}</h2>
                <p>{message}</p>
            </div>
            <Button variant="outline" icon={<ArrowLeft size={18} />} onClick={() => navigate(-1)}>
                Go Back
            </Button>
        </div>
    );
};

export default ComingSoon;

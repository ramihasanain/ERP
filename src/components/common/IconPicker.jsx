import React from 'react';
import * as LucideIcons from 'lucide-react';

const ICON_LIST = [
    'Building', 'Map', 'Armchair', 'Printer', 'Monitor', 'Truck', 'Wrench', 'Hammer',
    'Smartphone', 'Briefcase', 'Archive', 'Box', 'Camera', 'Cpu', 'HardDrive',
    'Headphones', 'Laptop', 'Server', 'Tablet', 'Tv', 'Watch'
];

const IconPicker = ({ selectedIcon, onSelect }) => {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            {ICON_LIST.map(iconName => {
                const Icon = LucideIcons[iconName];
                if (!Icon) return null;

                const isSelected = selectedIcon === iconName;

                return (
                    <button
                        key={iconName}
                        type="button"
                        onClick={() => onSelect(iconName)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--radius-sm)',
                            border: isSelected ? '2px solid var(--color-primary-600)' : '1px solid var(--color-border)',
                            background: isSelected ? 'var(--color-primary-50)' : 'white',
                            cursor: 'pointer',
                            color: isSelected ? 'var(--color-primary-600)' : 'var(--color-text-secondary)'
                        }}
                        title={iconName}
                    >
                        <Icon size={20} />
                    </button>
                );
            })}
        </div>
    );
};

export default IconPicker;

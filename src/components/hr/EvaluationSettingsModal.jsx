import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '@/components/Shared/Modal';
import Button from '@/components/Shared/Button';
import Input from '@/components/Shared/Input';
import { Plus, Trash2, Settings } from 'lucide-react';
import { useHR } from '@/context/HRContext';

const EvaluationSettingsModal = ({ isOpen, onClose }) => {
    const { t } = useTranslation(['hr', 'common']);

    const { evaluationCriteria, updateEvaluationCriteria } = useHR();
    const [criteriaList, setCriteriaList] = useState([]);

    useEffect(() => {
        if (isOpen) {
            setCriteriaList([...evaluationCriteria]);
        }
    }, [isOpen, evaluationCriteria]);

    const handleAdd = () => {
        setCriteriaList([...criteriaList, t('evaluationSettings.newCriteria')]);
    };

    const handleRemove = (index) => {
        const newList = criteriaList.filter((_, i) => i !== index);
        setCriteriaList(newList);
    };

    const handleChange = (index, value) => {
        const newList = [...criteriaList];
        newList[index] = value;
        setCriteriaList(newList);
    };

    const handleSave = () => {
        // Filter out empty strings
        const cleanedList = criteriaList.filter(c => c.trim() !== '');
        updateEvaluationCriteria(cleanedList);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('evaluationSettings.title')}
            size="md"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: 'var(--color-primary-50)', padding: '1rem', borderRadius: 'var(--radius-md)', color: 'var(--color-primary-800)', fontSize: '0.9rem' }}>
                    <p>{t('evaluationSettings.description')}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {criteriaList.map((criteria, index) => (
                        <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <Input
                                    value={criteria}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    placeholder={t('evaluationSettings.criteriaPlaceholder')}
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemove(index)}
                                style={{ color: 'var(--color-danger-600)' }}
                                disabled={criteriaList.length <= 1}
                            >
                                <Trash2 size={18} />
                            </Button>
                        </div>
                    ))}
                </div>

                <Button variant="outline" onClick={handleAdd} icon={<Plus size={16} />} style={{ alignSelf: 'flex-start' }}>
                    {t('evaluationSettings.addCriteria')}
                </Button>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                    <Button variant="ghost" onClick={onClose}>{t('common:actions.cancel')}</Button>
                    <Button onClick={handleSave}>{t('evaluationSettings.saveChanges')}</Button>
                </div>
            </div>
        </Modal>
    );
};

export default EvaluationSettingsModal;

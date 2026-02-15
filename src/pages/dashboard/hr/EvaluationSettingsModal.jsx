import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { Plus, Trash2, Settings } from 'lucide-react';
import { useHR } from '../../../context/HRContext';

const EvaluationSettingsModal = ({ isOpen, onClose }) => {
    const { evaluationCriteria, updateEvaluationCriteria } = useHR();
    const [criteriaList, setCriteriaList] = useState([]);

    useEffect(() => {
        if (isOpen) {
            setCriteriaList([...evaluationCriteria]);
        }
    }, [isOpen, evaluationCriteria]);

    const handleAdd = () => {
        setCriteriaList([...criteriaList, 'New Criteria']);
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
            title="Evaluation Settings"
            size="md"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: 'var(--color-primary-50)', padding: '1rem', borderRadius: 'var(--radius-md)', color: 'var(--color-primary-800)', fontSize: '0.9rem' }}>
                    <p>Manage the criteria used for employee performance evaluations. Changes here will apply to all <strong>future</strong> evaluations.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {criteriaList.map((criteria, index) => (
                        <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <Input
                                    value={criteria}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    placeholder="Enter criteria name"
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
                    Add Criteria
                </Button>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </div>
            </div>
        </Modal>
    );
};

export default EvaluationSettingsModal;

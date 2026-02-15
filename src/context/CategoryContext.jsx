import React, { createContext, useContext, useState } from 'react';

const CategoryContext = createContext();

const initialCategories = {
    'Inventory Items': [
        { id: 1, name: 'Electronics' },
        { id: 2, name: 'Office Supplies' },
        { id: 3, name: 'Furniture' },
        { id: 4, name: 'Raw Materials' },
    ],
    'Fixed Assets': [
        { id: 5, name: 'IT Equipment' },
        { id: 6, name: 'Furniture & Fixtures' },
        { id: 7, name: 'Vehicles' },
        { id: 8, name: 'Buildings' },
    ],
    'Expense Types': [
        { id: 9, name: 'Office Rent' },
        { id: 10, name: 'Utilities' },
        { id: 11, name: 'Travel' },
        { id: 12, name: 'Marketing' },
    ],
    'Account Types': [
        { id: 13, name: 'Current Assets' },
        { id: 14, name: 'Fixed Assets' },
        { id: 15, name: 'Liabilities' },
        { id: 16, name: 'Equity' },
        { id: 17, name: 'Revenue' },
        { id: 18, name: 'Expenses' },
    ],
};

export const CategoryProvider = ({ children }) => {
    const [categories, setCategories] = useState(initialCategories);

    const addCategory = (group, name) => {
        const newId = Date.now(); // Simple ID generation
        setCategories(prev => ({
            ...prev,
            [group]: [...prev[group], { id: newId, name }]
        }));
    };

    const updateCategory = (group, id, newName) => {
        setCategories(prev => ({
            ...prev,
            [group]: prev[group].map(c => c.id === id ? { ...c, name: newName } : c)
        }));
    };

    const deleteCategory = (group, id) => {
        setCategories(prev => ({
            ...prev,
            [group]: prev[group].filter(c => c.id !== id)
        }));
    };

    return (
        <CategoryContext.Provider value={{ categories, addCategory, updateCategory, deleteCategory }}>
            {children}
        </CategoryContext.Provider>
    );
};

export const useCategories = () => useContext(CategoryContext);

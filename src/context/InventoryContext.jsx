import React, { createContext, useContext, useState, useEffect } from 'react';

const InventoryContext = createContext();

export const useInventory = () => useContext(InventoryContext);

export const InventoryProvider = ({ children }) => {
    // --- State ---
    const [items, setItems] = useState([
        { id: '1', name: 'Office Chair', sku: 'FUR-001', type: 'Stock', uom: 'pcs', purchasePrice: 45, sellingPrice: 85, reorderLevel: 10, category: 'Furniture', taxRuleId: '1', glAccountId: '1200' },
        { id: '2', name: 'Laptop Stand', sku: 'ACC-002', type: 'Stock', uom: 'pcs', purchasePrice: 15, sellingPrice: 35, reorderLevel: 20, category: 'Accessories', taxRuleId: '1', glAccountId: '1200' },
        { id: '3', name: 'Consulting Service', sku: 'SVC-001', type: 'Service', uom: 'hr', purchasePrice: 0, sellingPrice: 100, reorderLevel: 0, category: 'Services', taxRuleId: '2', glAccountId: '' }
    ]);

    const [warehouses, setWarehouses] = useState([
        { id: '1', name: 'Main Warehouse', location: 'Amman - HQ', managerId: '1' },
        { id: '2', name: 'Retail Store', location: 'City Mall', managerId: '2' }
    ]);

    const [transactions, setTransactions] = useState([]);

    // Stock Levels: { itemId: { warehouseId: quantity } }
    // Derived state or separate state? Separate state is easier to manage for now.
    const [stockLevels, setStockLevels] = useState({
        '1': { '1': 50, '2': 12 },
        '2': { '1': 100, '2': 30 }
    });

    // --- Actions ---

    // Items
    const addItem = (item) => {
        setItems(prev => [...prev, { ...item, id: Date.now().toString() }]);
    };

    const updateItem = (id, updatedItem) => {
        setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
    };

    const deleteItem = (id) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    // Warehouses
    const addWarehouse = (warehouse) => {
        setWarehouses(prev => [...prev, { ...warehouse, id: Date.now().toString() }]);
    };

    const updateWarehouse = (id, updatedWarehouse) => {
        setWarehouses(prev => prev.map(w => w.id === id ? updatedWarehouse : w));
    };

    // Stock & Transactions
    const addTransaction = (transaction) => {
        // 1. Add to Ledger
        const newTrans = { ...transaction, id: Date.now().toString(), date: transaction.date || new Date().toISOString().split('T')[0] };
        setTransactions(prev => [newTrans, ...prev]);

        // 2. Update Stock Levels (if Posted)
        if (transaction.status === 'Posted') {
            updateStockLevels(transaction);
        }

        return newTrans;
    };

    const updateStockLevels = (transaction) => {
        setStockLevels(prev => {
            const newLevels = { ...prev };

            transaction.items.forEach(item => {
                const { itemId, quantity } = item;
                const warehouseId = transaction.warehouseId;

                if (!newLevels[itemId]) newLevels[itemId] = {};
                if (!newLevels[itemId][warehouseId]) newLevels[itemId][warehouseId] = 0;

                if (transaction.type === 'IN' || transaction.type === 'ADJUSTMENT_IN') {
                    newLevels[itemId][warehouseId] += parseFloat(quantity);
                } else if (transaction.type === 'OUT' || transaction.type === 'ADJUSTMENT_OUT') {
                    newLevels[itemId][warehouseId] -= parseFloat(quantity);
                }
                // Transfer logic to be added later
            });

            return newLevels;
        });
    };

    const getStockLevel = (itemId, warehouseId = null) => {
        if (!stockLevels[itemId]) return 0;
        if (warehouseId) return stockLevels[itemId][warehouseId] || 0;
        // Total across all warehouses
        return Object.values(stockLevels[itemId]).reduce((a, b) => a + b, 0);
    };

    return (
        <InventoryContext.Provider value={{
            items, addItem, updateItem, deleteItem,
            warehouses, addWarehouse, updateWarehouse,
            transactions, addTransaction,
            stockLevels, getStockLevel
        }}>
            {children}
        </InventoryContext.Provider>
    );
};

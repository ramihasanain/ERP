import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // null = not logged in
    const [isLoading, setIsLoading] = useState(false);

    const login = (email, password, role = 'admin') => {
        setIsLoading(true);
        // Simulate authentication
        return new Promise((resolve) => {
            setTimeout(() => {
                const userData = role === 'admin'
                    ? { id: 'USR-001', name: 'John Doe', email, role: 'admin', initials: 'JD', title: 'System Administrator' }
                    : { id: 'USR-002', name: 'Sarah Ahmed', email, role: 'employee', employeeId: 'EMP-002', initials: 'SA', title: 'Senior Developer' };
                setUser(userData);
                setIsLoading(false);
                resolve(userData);
            }, 800);
        });
    };

    const logout = () => {
        setUser(null);
    };

    const isAuthenticated = !!user;
    const isAdmin = user?.role === 'admin';
    const isEmployee = user?.role === 'employee';

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            isAdmin,
            isEmployee,
            isLoading,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

import React, { createContext, useContext, useState } from 'react';

const AttendanceContext = createContext();

export const useAttendance = () => {
    const context = useContext(AttendanceContext);
    if (!context) {
        throw new Error('useAttendance must be used within an AttendanceProvider');
    }
    return context;
};

export const AttendanceProvider = ({ children }) => {
    // Mock Data for Attendance Logs
    const [attendanceLogs, setAttendanceLogs] = useState([
        { id: 1, employeeId: 'EMP-001', date: '2023-10-25', checkIn: '09:00 AM', checkOut: '05:00 PM', status: 'Present' },
        { id: 2, employeeId: 'EMP-002', date: '2023-10-25', checkIn: '09:15 AM', checkOut: '05:15 PM', status: 'Late' },
        { id: 3, employeeId: 'EMP-001', date: '2023-10-26', checkIn: '08:55 AM', checkOut: null, status: 'Active' },
    ]);

    // Mock Data for Leave Requests
    const [leaveRequests, setLeaveRequests] = useState([
        { id: 1, employeeId: 'EMP-002', type: 'Annual Leave', startDate: '2023-11-01', endDate: '2023-11-03', status: 'Pending', reason: 'Family vacation' },
        { id: 2, employeeId: 'EMP-003', type: 'Sick Leave', startDate: '2023-10-20', endDate: '2023-10-20', status: 'Approved', reason: 'Flu' },
    ]);

    // Actions
    const clockIn = (employeeId) => {
        const today = new Date().toISOString().split('T')[0];
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newLog = {
            id: Date.now(),
            employeeId,
            date: today,
            checkIn: time,
            checkOut: null,
            status: 'Active'
        };
        setAttendanceLogs([...attendanceLogs, newLog]);
    };

    const clockOut = (employeeId) => {
        const today = new Date().toISOString().split('T')[0];
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setAttendanceLogs(prev => prev.map(log =>
            (log.employeeId === employeeId && log.date === today && !log.checkOut)
                ? { ...log, checkOut: time, status: 'Present' }
                : log
        ));
    };

    const addLeaveRequest = (request) => {
        const newRequest = { ...request, id: Date.now(), status: 'Pending' };
        setLeaveRequests([...leaveRequests, newRequest]);
    };

    const updateLeaveStatus = (id, status) => {
        setLeaveRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
    };

    const value = {
        attendanceLogs,
        leaveRequests,
        clockIn,
        clockOut,
        addLeaveRequest,
        updateLeaveStatus
    };

    return (
        <AttendanceContext.Provider value={value}>
            {children}
        </AttendanceContext.Provider>
    );
};

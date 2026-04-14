// v2.8.0 - 2026-03-08
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { CategoryProvider } from '@/context/CategoryContext';
import { AccountingProvider } from '@/context/AccountingContext';
import { HRProvider } from '@/context/HRContext';
import { ProcurementProvider } from '@/context/ProcurementContext';
import { PayrollProvider } from '@/context/PayrollContext';
import { AuthProvider } from '@/context/AuthContext';
import { PermissionsProvider } from '@/context/PermissionsContext';
import { AuditProvider } from '@/context/AuditContext';
import { NotificationsProvider } from '@/context/NotificationsContext';
import { AttendanceProvider } from '@/context/AttendanceContext';
import { InventoryProvider } from '@/context/InventoryContext';
import AppRoutes from '@/routes/appRoutes';
import ScrollToTop from '@/core/ScrollToTop';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationsProvider>
          <ThemeProvider>
            <LanguageProvider>
              <CategoryProvider>
                <AccountingProvider>
                  <AuditProvider>
                    <HRProvider>
                      <PermissionsProvider>
                        <PayrollProvider>
                          <InventoryProvider>
                            <AttendanceProvider>
                              <ProcurementProvider>
                                <BrowserRouter>
                                  <ScrollToTop />
                                  <AppRoutes />
                                </BrowserRouter>
                              </ProcurementProvider>
                            </AttendanceProvider>
                          </InventoryProvider>
                        </PayrollProvider>
                      </PermissionsProvider>
                    </HRProvider>
                  </AuditProvider>
                </AccountingProvider>
              </CategoryProvider>
            </LanguageProvider>
          </ThemeProvider>
        </NotificationsProvider>
      </AuthProvider>
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}

export default App;

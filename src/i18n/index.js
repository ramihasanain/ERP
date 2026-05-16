import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { NAMESPACES } from './namespaces';

import enCommon from '@/locales/en/common.json';
import enNav from '@/locales/en/nav.json';
import enAuth from '@/locales/en/auth.json';
import enLanding from '@/locales/en/landing.json';
import enOnboarding from '@/locales/en/onboarding.json';
import enDashboard from '@/locales/en/dashboard.json';
import enAccounting from '@/locales/en/accounting.json';
import enHr from '@/locales/en/hr.json';
import enInventory from '@/locales/en/inventory.json';
import enProcurement from '@/locales/en/procurement.json';
import enReports from '@/locales/en/reports.json';
import enSettings from '@/locales/en/settings.json';
import enPermissions from '@/locales/en/permissions.json';
import enAuditor from '@/locales/en/auditor.json';
import enEmployee from '@/locales/en/employee.json';
import enNotifications from '@/locales/en/notifications.json';
import enErrors from '@/locales/en/errors.json';

import arCommon from '@/locales/ar/common.json';
import arNav from '@/locales/ar/nav.json';
import arAuth from '@/locales/ar/auth.json';
import arLanding from '@/locales/ar/landing.json';
import arOnboarding from '@/locales/ar/onboarding.json';
import arDashboard from '@/locales/ar/dashboard.json';
import arAccounting from '@/locales/ar/accounting.json';
import arHr from '@/locales/ar/hr.json';
import arInventory from '@/locales/ar/inventory.json';
import arProcurement from '@/locales/ar/procurement.json';
import arReports from '@/locales/ar/reports.json';
import arSettings from '@/locales/ar/settings.json';
import arPermissions from '@/locales/ar/permissions.json';
import arAuditor from '@/locales/ar/auditor.json';
import arEmployee from '@/locales/ar/employee.json';
import arNotifications from '@/locales/ar/notifications.json';
import arErrors from '@/locales/ar/errors.json';

import deCommon from '@/locales/de/common.json';
import deNav from '@/locales/de/nav.json';
import deAuth from '@/locales/de/auth.json';
import deLanding from '@/locales/de/landing.json';
import deOnboarding from '@/locales/de/onboarding.json';
import deDashboard from '@/locales/de/dashboard.json';
import deAccounting from '@/locales/de/accounting.json';
import deHr from '@/locales/de/hr.json';
import deInventory from '@/locales/de/inventory.json';
import deProcurement from '@/locales/de/procurement.json';
import deReports from '@/locales/de/reports.json';
import deSettings from '@/locales/de/settings.json';
import dePermissions from '@/locales/de/permissions.json';
import deAuditor from '@/locales/de/auditor.json';
import deEmployee from '@/locales/de/employee.json';
import deNotifications from '@/locales/de/notifications.json';
import deErrors from '@/locales/de/errors.json';

const resources = {
    en: {
        common: enCommon,
        nav: enNav,
        auth: enAuth,
        landing: enLanding,
        onboarding: enOnboarding,
        dashboard: enDashboard,
        accounting: enAccounting,
        hr: enHr,
        inventory: enInventory,
        procurement: enProcurement,
        reports: enReports,
        settings: enSettings,
        permissions: enPermissions,
        auditor: enAuditor,
        employee: enEmployee,
        notifications: enNotifications,
        errors: enErrors,
    },
    ar: {
        common: arCommon,
        nav: arNav,
        auth: arAuth,
        landing: arLanding,
        onboarding: arOnboarding,
        dashboard: arDashboard,
        accounting: arAccounting,
        hr: arHr,
        inventory: arInventory,
        procurement: arProcurement,
        reports: arReports,
        settings: arSettings,
        permissions: arPermissions,
        auditor: arAuditor,
        employee: arEmployee,
        notifications: arNotifications,
        errors: arErrors,
    },
    de: {
        common: deCommon,
        nav: deNav,
        auth: deAuth,
        landing: deLanding,
        onboarding: deOnboarding,
        dashboard: deDashboard,
        accounting: deAccounting,
        hr: deHr,
        inventory: deInventory,
        procurement: deProcurement,
        reports: deReports,
        settings: deSettings,
        permissions: dePermissions,
        auditor: deAuditor,
        employee: deEmployee,
        notifications: deNotifications,
        errors: deErrors,
    },
};

const savedLanguage =
    typeof localStorage !== 'undefined' ? localStorage.getItem('language') : null;
const initialLng = savedLanguage && ['en', 'ar', 'de'].includes(savedLanguage) ? savedLanguage : 'en';

i18n.use(initReactI18next).init({
    resources,
    lng: initialLng,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: NAMESPACES,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
});

export default i18n;

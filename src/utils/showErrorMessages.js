import { toast } from 'sonner';
import translateApiError from '@/utils/translateApiError';
import i18n from '@/i18n';

const normalizeMessages = (errorData) => {
    if (!errorData) return [i18n.t('errors:generic.somethingWentWrong')];
    if (typeof errorData === 'string') return [translateApiError(errorData)];

    if (Array.isArray(errorData)) {
        return errorData.filter(Boolean).map((item) => translateApiError(String(item)));
    }

    if (typeof errorData === 'object') {
        const messages = [];

        Object.values(errorData).forEach((value) => {
            if (Array.isArray(value)) {
                value.forEach((item) => {
                    if (item) messages.push(translateApiError(String(item)));
                });
            } else if (value) {
                messages.push(translateApiError(String(value)));
            }
        });

        return messages.length ? messages : [i18n.t('errors:generic.somethingWentWrong')];
    }

    return [i18n.t('errors:generic.somethingWentWrong')];
};

export default function handleErrorAlerts(errorData) {
    const messages = normalizeMessages(errorData);
    messages.forEach((message) => toast.error(message));
}

import i18n from '@/i18n';
import { getApiErrorMessage } from '@/utils/apiErrorMessage';

const normalizeKey = (message) =>
    String(message || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');

/**
 * Translate a known API/validation message, or return the original string.
 * @param {unknown} error - axios error, string, or backend payload
 * @param {string} [fallbackKey] - i18n key under errors.generic.*
 */
export const translateApiError = (error, fallbackKey = 'errors:generic.unknown') => {
    const raw = getApiErrorMessage(error, '');
    if (!raw) return i18n.t(fallbackKey);

    const normalized = normalizeKey(raw);

    const apiKey = `errors:api.${normalized}`;
    if (i18n.exists(apiKey)) return i18n.t(apiKey);

    const status = error?.response?.status;
    if (status === 401) return i18n.t('errors:generic.unauthorized');
    if (status === 403) return i18n.t('errors:generic.forbidden');
    if (status === 404) return i18n.t('errors:generic.notFound');
    if (status >= 500) return i18n.t('errors:generic.serverError');

    if (!error?.response && error?.message?.toLowerCase?.().includes('network')) {
        return i18n.t('errors:generic.network');
    }

    return raw;
};

export default translateApiError;

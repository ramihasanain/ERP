/**
 * Human-readable message from axios / fetch-style errors or backend payloads.
 */
export const getApiErrorMessage = (error, fallback = '') => {
    if (error == null) return fallback;
    if (typeof error === 'string') return error || fallback;

    const data = error?.response?.data;
    if (typeof data === 'string' && data.trim()) return data;

    if (data?.error != null && String(data.error).trim()) {
        return String(data.error);
    }

    if (data?.detail != null) {
        const d = data.detail;
        if (typeof d === 'string' && d.trim()) return d;
        if (Array.isArray(d)) {
            const parts = d.map((item) => {
                if (typeof item === 'string') return item;
                if (item?.msg) return String(item.msg);
                return JSON.stringify(item);
            });
            const joined = parts.filter(Boolean).join('; ');
            if (joined) return joined;
        }
    }

    if (data?.message != null && String(data.message).trim()) {
        return String(data.message);
    }

    // Handle field-level validation payloads, e.g. { unit: "Must be a valid UUID." }
    if (data && typeof data === 'object' && !Array.isArray(data)) {
        const fieldMessages = Object.entries(data)
            .flatMap(([field, value]) => {
                if (value == null) return [];
                if (Array.isArray(value)) {
                    return value.map((item) => `${field}: ${String(item)}`);
                }
                if (typeof value === 'object') {
                    if (value?.msg) return [`${field}: ${String(value.msg)}`];
                    return [`${field}: ${JSON.stringify(value)}`];
                }
                return [`${field}: ${String(value)}`];
            })
            .filter((msg) => msg.replace(/^[^:]+:\s*/, '').trim());

        if (fieldMessages.length) {
            return fieldMessages.join('; ');
        }
    }

    if (typeof error?.message === 'string' && error.message.trim()) {
        return error.message;
    }

    return fallback;
};

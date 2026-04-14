import { toast } from 'sonner';

const normalizeMessages = (errorData) => {
  if (!errorData) return ['Something went wrong.'];
  if (typeof errorData === 'string') return [errorData];

  if (Array.isArray(errorData)) {
    return errorData.filter(Boolean).map((item) => String(item));
  }

  if (typeof errorData === 'object') {
    const messages = [];

    Object.values(errorData).forEach((value) => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item) messages.push(String(item));
        });
      } else if (value) {
        messages.push(String(value));
      }
    });

    return messages.length ? messages : ['Something went wrong.'];
  }

  return ['Something went wrong.'];
};

export default function handleErrorAlerts(errorData) {
  const messages = normalizeMessages(errorData);
  messages.forEach((message) => toast.error(message));
}

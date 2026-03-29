function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

const fallbackApiBaseUrl = import.meta.env.DEV
  ? 'http://localhost:3001'
  : 'https://essentialgoods-api.essentialgoods-store.workers.dev';

export const apiBaseUrl = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL ?? fallbackApiBaseUrl);

export function apiUrl(path: string) {
  if (!path.startsWith('/')) {
    throw new Error(`API path must start with "/": ${path}`);
  }

  return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
}

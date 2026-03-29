function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

export const apiBaseUrl = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL ?? '');

export function apiUrl(path: string) {
  if (!path.startsWith('/')) {
    throw new Error(`API path must start with "/": ${path}`);
  }

  return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
}

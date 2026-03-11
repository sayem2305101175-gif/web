type QueryParams = Record<string, string | number | boolean | null | undefined>;

const normalizedBaseUrl = resolveApiBaseUrl((import.meta.env.VITE_API_BASE_URL || '').trim());

export const isBackendConfigured = normalizedBaseUrl.length > 0;

export class ApiError extends Error {
  status: number;
  responseBody: unknown;

  constructor(message: string, status: number, responseBody: unknown) {
    super(message);
    this.status = status;
    this.responseBody = responseBody;
  }
}

const buildUrl = (path: string, query?: QueryParams) => {
  const baseUrl = `${normalizedBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const url = new URL(baseUrl);

  if (!query) {
    return url.toString();
  }

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    url.searchParams.set(key, String(value));
  }

  return url.toString();
};

const request = async <T>(
  method: 'GET' | 'POST',
  path: string,
  options: { query?: QueryParams; body?: unknown } = {}
): Promise<T> => {
  if (!isBackendConfigured) {
    throw new Error('Backend base URL is not configured.');
  }

  const response = await fetch(buildUrl(path, options.query), {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const parsedBody = await parseJsonResponse(response);

  if (!response.ok) {
    throw new ApiError(resolveApiErrorMessage(response.status, parsedBody), response.status, parsedBody);
  }

  return parsedBody as T;
};

export const apiClient = {
  get: <T>(path: string, query?: QueryParams) => request<T>('GET', path, { query }),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, { body }),
};

async function parseJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function resolveApiBaseUrl(rawBaseUrl: string) {
  const trimmedBaseUrl = rawBaseUrl.trim();
  if (!trimmedBaseUrl) {
    return '';
  }

  if (typeof window === 'undefined') {
    return trimmedBaseUrl.replace(/\/+$/, '');
  }

  try {
    const baseUrl = new URL(trimmedBaseUrl, window.location.origin);

    if (shouldUseCurrentHostname(baseUrl.hostname, window.location.hostname)) {
      baseUrl.hostname = window.location.hostname;
    }

    return baseUrl.toString().replace(/\/+$/, '');
  } catch {
    return trimmedBaseUrl.replace(/\/+$/, '');
  }
}

function shouldUseCurrentHostname(apiHostname: string, pageHostname: string) {
  return isLoopbackHost(apiHostname) && !isLoopbackHost(pageHostname);
}

function isLoopbackHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]';
}

function resolveApiErrorMessage(status: number, responseBody: unknown) {
  if (
    responseBody &&
    typeof responseBody === 'object' &&
    'message' in responseBody &&
    typeof responseBody.message === 'string' &&
    responseBody.message.trim().length > 0
  ) {
    return responseBody.message;
  }

  return `Backend request failed with status ${status}.`;
}

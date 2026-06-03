import type { Card, CardSearchFilters, CardSearchResponse } from './types';

const DEFAULT_BASE_URL = 'https://api.gatcg.com';
const DEFAULT_PAGE_SIZE = 72;

export const gatcgBaseUrl =
  (import.meta.env.VITE_GATCG_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  DEFAULT_BASE_URL;

const appendMany = (params: URLSearchParams, key: string, values?: string[]) => {
  values?.filter(Boolean).forEach((value) => params.append(key, value));
};

export const buildCardImageUrl = (path?: string | null) => {
  if (!path) {
    return undefined;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${gatcgBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

const buildSearchParams = (filters: CardSearchFilters) => {
  const params = new URLSearchParams();
  params.set('page', String(filters.page ?? 1));
  params.set('page_size', String(filters.pageSize ?? DEFAULT_PAGE_SIZE));

  if (filters.name) {
    params.set('name', filters.name);
  }

  if (filters.effect) {
    params.set('effect', filters.effect);
  }

  appendMany(params, 'element', filters.elements);
  appendMany(params, 'type', filters.types);
  appendMany(params, 'subtype', filters.subtypes);
  appendMany(params, 'class', filters.classes);

  return params;
};

const getJson = async <T>(url: string, signal?: AbortSignal): Promise<T> => {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`GA API request failed (${response.status}): ${body || response.statusText}`);
  }

  return response.json() as Promise<T>;
};

export const searchCards = (filters: CardSearchFilters, signal?: AbortSignal) => {
  const params = buildSearchParams(filters);
  return getJson<CardSearchResponse>(`${gatcgBaseUrl}/cards/search?${params.toString()}`, signal);
};

export const getCardBySlug = async (slug: string, signal?: AbortSignal) => {
  const payload = await getJson<Card | { data: Card }>(
    `${gatcgBaseUrl}/cards/${encodeURIComponent(slug)}`,
    signal,
  );

  return 'data' in payload ? payload.data : payload;
};

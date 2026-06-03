import type { Card, CardEdition } from '../lib/gatcg/types';

export const getPrimaryEdition = (card: Card): CardEdition | undefined =>
  card.result_editions?.[0] ?? card.editions?.find((edition) => edition.image) ?? card.editions?.[0];

export const formatList = (values: Array<string | null | undefined>) => values.filter(Boolean).join(' / ');

export const formatCardText = (value: string) =>
  value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

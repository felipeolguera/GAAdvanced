export type CardCost = {
  type?: string | null;
  value?: string | number | null;
};

export type CardSet = {
  id?: string;
  language?: string;
  name?: string;
  prefix?: string;
  release_date?: string | null;
};

export type CardEdition = {
  uuid?: string;
  card_id?: string;
  slug?: string;
  collector_number?: string | null;
  configuration?: string | null;
  effect?: string | null;
  effect_raw?: string | null;
  effect_html?: string | null;
  flavor?: string | null;
  illustrator?: string | null;
  image?: string | null;
  orientation?: string | null;
  rarity?: number | string | null;
  set?: CardSet | null;
};

export type Card = {
  uuid: string;
  slug: string;
  name: string;
  classes?: string[];
  cost?: CardCost | null;
  cost_memory?: number | null;
  cost_reserve?: number | null;
  durability?: number | null;
  editions?: CardEdition[];
  effect?: string | null;
  effect_html?: string | null;
  effect_raw?: string | null;
  element?: string | null;
  elements?: string[];
  flavor?: string | null;
  legality?: unknown;
  level?: number | null;
  life?: number | null;
  power?: number | null;
  referenced_by?: unknown[];
  references?: unknown[];
  result_editions?: CardEdition[];
  rule?: string[];
  speed?: string | null;
  subtypes?: string[];
  types?: string[];
};

export type CardSearchResponse = {
  data: Card[];
  has_more: boolean;
  order?: string;
  page: number;
  page_size: number;
  paginated_cards_count?: number;
  sort?: string;
  total_cards: number;
  total_pages: number;
};

export type CardSearchFilters = {
  name?: string;
  effect?: string;
  elements?: string[];
  types?: string[];
  subtypes?: string[];
  classes?: string[];
  page?: number;
  pageSize?: number;
};

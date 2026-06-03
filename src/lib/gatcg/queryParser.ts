import type { Card, CardSearchFilters } from './types';

export type ParsedQuery = {
  original: string;
  apiFilters: CardSearchFilters;
  displayFilters: string[];
  required: {
    elements: string[];
    types: string[];
    subtypes: string[];
    classes: string[];
    effectPhrases: string[];
  };
  fallbackName?: string;
};

type Vocabulary = Record<string, string[]>;

const elementVocabulary: Vocabulary = {
  FIRE: ['fire', 'flame', 'burn', 'burning', 'red'],
  WATER: ['water', 'aqua', 'ice', 'frost', 'blue'],
  WIND: ['wind', 'air', 'storm', 'green'],
  NORM: ['norm', 'normal', 'neutral', 'basic'],
  ARCANE: ['arcane', 'magic', 'purple'],
  LUXEM: ['luxem', 'light', 'holy'],
  UMBRA: ['umbra', 'shadow', 'dark', 'darkness'],
  TERA: ['tera', 'earth', 'stone'],
  EXIA: ['exia'],
  ASTRA: ['astra', 'star', 'celestial'],
};

const typeVocabulary: Vocabulary = {
  ACTION: ['action', 'actions'],
  ALLY: ['ally', 'allies', 'unit', 'units'],
  ATTACK: ['attack', 'attacks', 'weapon attack', 'weapon attacks'],
  CHAMPION: ['champion', 'champions'],
  DOMAIN: ['domain', 'domains'],
  ITEM: ['item', 'items'],
  REGALIA: ['regalia', 'material deck'],
};

const subtypeVocabulary: Vocabulary = {
  SPELL: ['spell', 'spells'],
  SWORD: ['sword', 'swords'],
  BOW: ['bow', 'bows'],
  DAGGER: ['dagger', 'daggers'],
  GUN: ['gun', 'guns'],
  STAFF: ['staff', 'staves'],
  TOME: ['tome', 'tomes'],
  WAND: ['wand', 'wands'],
  WARRIOR: ['warrior'],
  MAGE: ['mage'],
  RANGER: ['ranger'],
  CLERIC: ['cleric'],
  ASSASSIN: ['assassin'],
  GUARDIAN: ['guardian'],
  TAMER: ['tamer'],
};

const classVocabulary: Vocabulary = {
  ASSASSIN: ['assassin', 'assassins'],
  CLERIC: ['cleric', 'clerics'],
  GUARDIAN: ['guardian', 'guardians'],
  MAGE: ['mage', 'mages'],
  RANGER: ['ranger', 'rangers'],
  TAMER: ['tamer', 'tamers'],
  WARRIOR: ['warrior', 'warriors'],
};

const effectVocabulary: Array<{ label: string; terms: string[]; phrase: string }> = [
  { label: 'targets units', terms: ['target unit', 'target units'], phrase: 'target unit' },
  { label: 'targets allies', terms: ['target ally', 'target allies'], phrase: 'target ally' },
  { label: 'targets champions', terms: ['target champion', 'target champions'], phrase: 'target champion' },
  { label: 'draws cards', terms: ['draw a card', 'draw cards'], phrase: 'draw' },
  { label: 'banishes cards', terms: ['banish', 'banishes', 'banished'], phrase: 'banish' },
  { label: 'recovers life', terms: ['recover', 'heals', 'heal'], phrase: 'recover' },
  { label: 'rests objects', terms: ['rest target', 'rests target', 'rested'], phrase: 'rest' },
  { label: 'wakes up objects', terms: ['wake up', 'wakes up'], phrase: 'wake up' },
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/["'.,:;!?()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const singularize = (value: string) => value.replace(/\bunits\b/g, 'unit').replace(/\ballies\b/g, 'ally');

const includesTerm = (haystack: string, term: string) => {
  const normalizedHaystack = ` ${normalize(haystack)} `;
  const normalizedTerm = normalize(term);
  return normalizedHaystack.includes(` ${normalizedTerm} `) || normalizedHaystack.includes(normalizedTerm);
};

const collectMatches = (text: string, vocabulary: Vocabulary) =>
  Object.entries(vocabulary)
    .filter(([, aliases]) => aliases.some((alias) => includesTerm(text, alias)))
    .map(([value]) => value);

const extractExplicitEffectPhrase = (text: string) => {
  const matches = [
    /(?:effect|text)\s+(?:contains|has|with)\s+(.+)$/i,
    /(?:has|have|with)\s+["']([^"']+)["']\s+(?:in|on)\s+(?:the\s+)?(?:effect|text)/i,
    /(?:effect|text)\s+["']([^"']+)["']/i,
  ];

  for (const pattern of matches) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return normalize(match[1]);
    }
  }

  return undefined;
};

export const parseNaturalLanguageQuery = (query: string): ParsedQuery => {
  const original = query.trim();
  const normalized = normalize(original);
  const elements = collectMatches(normalized, elementVocabulary);
  const types = collectMatches(normalized, typeVocabulary);
  const subtypes = collectMatches(normalized, subtypeVocabulary);
  const classes = collectMatches(normalized, classVocabulary);
  const effectPhrases: string[] = [];
  const displayFilters: string[] = [];

  for (const { label, terms, phrase } of effectVocabulary) {
    if (terms.some((term) => includesTerm(normalized, term))) {
      effectPhrases.push(phrase);
      displayFilters.push(label);
    }
  }

  const explicitEffect = extractExplicitEffectPhrase(original);
  if (explicitEffect && !effectPhrases.includes(explicitEffect)) {
    effectPhrases.push(explicitEffect);
    displayFilters.push(`effect contains "${explicitEffect}"`);
  }

  elements.forEach((element) => displayFilters.push(`${element.toLowerCase()} element`));
  types.forEach((type) => displayFilters.push(`${type.toLowerCase()} type`));
  subtypes.forEach((subtype) => displayFilters.push(`${subtype.toLowerCase()} subtype`));
  classes.forEach((cardClass) => displayFilters.push(`${cardClass.toLowerCase()} class`));

  const apiFilters: CardSearchFilters = {
    elements,
    types,
    subtypes,
    classes,
    effect: effectPhrases[0],
  };

  const hasStructuredFilter =
    elements.length > 0 || types.length > 0 || subtypes.length > 0 || classes.length > 0 || effectPhrases.length > 0;

  if (!hasStructuredFilter && original) {
    apiFilters.name = original;
  }

  return {
    original,
    apiFilters,
    displayFilters: [...new Set(displayFilters)],
    required: { elements, types, subtypes, classes, effectPhrases },
    fallbackName: hasStructuredFilter ? undefined : original,
  };
};

const valuesIncludeAny = (actualValues: Array<string | null | undefined>, requiredValues: string[]) => {
  if (requiredValues.length === 0) {
    return true;
  }

  const normalizedValues = actualValues.filter(Boolean).map((value) => normalize(String(value)));
  return requiredValues.some((required) => normalizedValues.includes(normalize(required)));
};

const cardEffectText = (card: Card) =>
  [card.effect_raw, card.effect, card.effect_html, ...(card.editions ?? []).map((edition) => edition.effect_raw ?? edition.effect)]
    .filter(Boolean)
    .join(' ');

const effectIncludesPhrase = (effect: string, phrase: string) => {
  const normalizedEffect = singularize(normalize(effect));
  const normalizedPhrase = singularize(normalize(phrase));
  return normalizedEffect.includes(normalizedPhrase);
};

export const cardMatchesParsedQuery = (card: Card, parsed: ParsedQuery) => {
  const { elements, types, subtypes, classes, effectPhrases } = parsed.required;

  if (!valuesIncludeAny([card.element, ...(card.elements ?? [])], elements)) {
    return false;
  }

  if (!valuesIncludeAny(card.types ?? [], types)) {
    return false;
  }

  if (!valuesIncludeAny(card.subtypes ?? [], subtypes)) {
    return false;
  }

  if (!valuesIncludeAny(card.classes ?? [], classes)) {
    return false;
  }

  if (effectPhrases.length > 0) {
    const effect = cardEffectText(card);
    return effectPhrases.every((phrase) => effectIncludesPhrase(effect, phrase));
  }

  return true;
};

export const getSearchAttempts = (parsed: ParsedQuery): CardSearchFilters[] => {
  const base = parsed.apiFilters;
  const attempts: CardSearchFilters[] = [base];

  if ((base.subtypes?.length ?? 0) > 0) {
    attempts.push({ ...base, subtypes: [] });
  }

  if ((base.types?.length ?? 0) > 0) {
    attempts.push({ ...base, types: [], subtypes: [] });
  }

  if (base.effect) {
    attempts.push({
      ...base,
      effect: undefined,
      name: undefined,
      pageSize: 120,
    });
  }

  if (base.name) {
    attempts.push({ name: base.name });
  }

  const seen = new Set<string>();
  return attempts.filter((attempt) => {
    const key = JSON.stringify(attempt);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

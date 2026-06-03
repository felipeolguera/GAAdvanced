import { FormEvent, useCallback, useMemo, useRef, useState } from 'react';
import { CardGrid } from './components/CardGrid';
import { CardLightbox } from './components/CardLightbox';
import { getCardBySlug, searchCards } from './lib/gatcg/client';
import {
  cardMatchesParsedQuery,
  getSearchAttempts,
  parseNaturalLanguageQuery,
  type ParsedQuery,
} from './lib/gatcg/queryParser';
import type { Card, CardSearchFilters, CardSearchResponse } from './lib/gatcg/types';

type SearchState = {
  query: string;
  parsed?: ParsedQuery;
  cards: Card[];
  hasMore: boolean;
  page: number;
  activeAttempt?: CardSearchFilters;
  totalCards?: number;
  status: 'idle' | 'loading' | 'loading-more' | 'success' | 'error';
  error?: string;
};

const examples = [
  'fire spells that target units',
  'water allies that draw cards',
  'mage actions with banish in the effect',
  'wind attacks for ranger',
];

const initialState: SearchState = {
  query: '',
  cards: [],
  hasMore: false,
  page: 1,
  status: 'idle',
};

const mergeUniqueCards = (current: Card[], incoming: Card[]) => {
  const seen = new Set(current.map((card) => card.uuid ?? card.slug));
  const next = [...current];

  for (const card of incoming) {
    const key = card.uuid ?? card.slug;
    if (!seen.has(key)) {
      seen.add(key);
      next.push(card);
    }
  }

  return next;
};

const withPaging = (filters: CardSearchFilters, page: number): CardSearchFilters => ({
  ...filters,
  page,
  pageSize: filters.pageSize ?? 72,
});

function App() {
  const [input, setInput] = useState('fire spells that target units');
  const [state, setState] = useState<SearchState>(initialState);
  const [selectedCard, setSelectedCard] = useState<Card | undefined>();
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const currentSearch = useRef<AbortController | null>(null);
  const currentDetail = useRef<AbortController | null>(null);

  const runSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setState(initialState);
      return;
    }

    currentSearch.current?.abort();
    const controller = new AbortController();
    currentSearch.current = controller;

    const parsed = parseNaturalLanguageQuery(trimmed);
    setState({
      query: trimmed,
      parsed,
      cards: [],
      hasMore: false,
      page: 1,
      status: 'loading',
    });

    try {
      let chosenAttempt: CardSearchFilters | undefined;
      let chosenResponse: CardSearchResponse | undefined;
      let chosenCards: Card[] = [];

      for (const attempt of getSearchAttempts(parsed)) {
        const response = await searchCards(withPaging(attempt, 1), controller.signal);
        const filtered = response.data.filter((card) => cardMatchesParsedQuery(card, parsed));

        if (filtered.length > 0 || response.data.length === 0) {
          chosenAttempt = attempt;
          chosenResponse = response;
          chosenCards = filtered;
          break;
        }
      }

      if (!chosenAttempt || !chosenResponse) {
        chosenAttempt = parsed.apiFilters;
        chosenResponse = await searchCards(withPaging(chosenAttempt, 1), controller.signal);
        chosenCards = chosenResponse.data.filter((card) => cardMatchesParsedQuery(card, parsed));
      }

      setState({
        query: trimmed,
        parsed,
        cards: chosenCards,
        hasMore: chosenResponse.has_more,
        page: 1,
        activeAttempt: chosenAttempt,
        totalCards: chosenResponse.total_cards,
        status: 'success',
      });
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      setState({
        query: trimmed,
        parsed,
        cards: [],
        hasMore: false,
        page: 1,
        status: 'error',
        error: error instanceof Error ? error.message : 'Could not search Grand Archive cards.',
      });
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!state.parsed || !state.activeAttempt || state.status === 'loading-more') {
      return;
    }

    currentSearch.current?.abort();
    const controller = new AbortController();
    currentSearch.current = controller;
    const nextPage = state.page + 1;

    setState((current) => ({ ...current, status: 'loading-more' }));

    try {
      const response = await searchCards(withPaging(state.activeAttempt, nextPage), controller.signal);
      const filtered = response.data.filter((card) => cardMatchesParsedQuery(card, state.parsed!));

      setState((current) => ({
        ...current,
        cards: mergeUniqueCards(current.cards, filtered),
        hasMore: response.has_more,
        page: nextPage,
        status: 'success',
      }));
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      setState((current) => ({
        ...current,
        status: 'error',
        error: error instanceof Error ? error.message : 'Could not load more results.',
      }));
    }
  }, [state.activeAttempt, state.page, state.parsed, state.status]);

  const openCard = useCallback((card: Card) => {
    setSelectedCard(card);
    setIsLoadingDetail(true);
    currentDetail.current?.abort();
    const controller = new AbortController();
    currentDetail.current = controller;

    getCardBySlug(card.slug, controller.signal)
      .then((detail) => {
        if (!controller.signal.aborted) {
          setSelectedCard(detail);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSelectedCard(card);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingDetail(false);
        }
      });
  }, []);

  const closeCard = useCallback(() => {
    currentDetail.current?.abort();
    setSelectedCard(undefined);
    setIsLoadingDetail(false);
  }, []);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runSearch(input);
  };

  const resultLabel = useMemo(() => {
    if (state.status === 'idle') {
      return 'Try a natural search to begin.';
    }

    if (state.status === 'loading') {
      return 'Searching the GA API...';
    }

    if (state.cards.length === 0) {
      return 'No matching cards found yet.';
    }

    return `${state.cards.length} matching ${state.cards.length === 1 ? 'card' : 'cards'} shown`;
  }, [state.cards.length, state.status]);

  return (
    <main>
      <section className="hero">
        <div className="hero__copy">
          <p className="eyebrow">Grand Archive advanced search</p>
          <h1>Find cards with natural English.</h1>
          <p>
            Search phrases like <strong>fire spells that target units</strong>. The app turns them into Grand Archive API filters,
            verifies the card text, and opens full details in a lightbox.
          </p>
        </div>

        <form className="search-panel" onSubmit={onSubmit}>
          <label htmlFor="card-search">Describe the cards you want</label>
          <div className="search-row">
            <input
              id="card-search"
              type="search"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Example: fire spells that target units"
            />
            <button type="submit" disabled={state.status === 'loading'}>
              {state.status === 'loading' ? 'Searching...' : 'Search'}
            </button>
          </div>
          <div className="example-row" aria-label="Example searches">
            {examples.map((example) => (
              <button
                type="button"
                key={example}
                onClick={() => {
                  setInput(example);
                  void runSearch(example);
                }}
              >
                {example}
              </button>
            ))}
          </div>
        </form>
      </section>

      <section className="results-header" aria-live="polite">
        <div>
          <p className="eyebrow">Results</p>
          <h2>{resultLabel}</h2>
          {state.totalCards !== undefined ? <p className="muted">GA API returned {state.totalCards} raw cards before local checks.</p> : null}
        </div>
        {state.parsed?.displayFilters.length ? (
          <div className="chip-row chip-row--right">
            {state.parsed.displayFilters.map((filter) => (
              <span className="chip chip--active" key={filter}>
                {filter}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      {state.status === 'error' ? <p className="error-box">{state.error}</p> : null}

      {state.status === 'loading' ? (
        <div className="skeleton-grid" aria-label="Loading cards">
          {Array.from({ length: 8 }).map((_, index) => (
            <div className="skeleton-card" key={index} />
          ))}
        </div>
      ) : (
        <CardGrid cards={state.cards} onSelect={openCard} />
      )}

      {state.status !== 'loading' && state.cards.length === 0 && state.query ? (
        <section className="empty-state">
          <h3>No exact matches</h3>
          <p>
            Try simplifying the phrase or searching for a card name. The parser currently understands elements, types,
            classes, subtypes, and common effect phrases like target unit, draw, banish, recover, rest, and wake up.
          </p>
        </section>
      ) : null}

      {state.hasMore && state.cards.length > 0 ? (
        <div className="load-more-row">
          <button type="button" onClick={() => void loadMore()} disabled={state.status === 'loading-more'}>
            {state.status === 'loading-more' ? 'Loading...' : 'Load more'}
          </button>
        </div>
      ) : null}

      {selectedCard ? <CardLightbox card={selectedCard} isLoadingDetail={isLoadingDetail} onClose={closeCard} /> : null}
    </main>
  );
}

export default App;

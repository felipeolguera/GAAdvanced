import { buildCardImageUrl } from '../lib/gatcg/client';
import type { Card } from '../lib/gatcg/types';
import { formatCardText, getPrimaryEdition } from './cardDisplay';

type CardGridProps = {
  cards: Card[];
  onSelect: (card: Card) => void;
};

const CardTile = ({ card, onSelect }: { card: Card; onSelect: (card: Card) => void }) => {
  const edition = getPrimaryEdition(card);
  const imageUrl = buildCardImageUrl(edition?.image);

  return (
    <button className="card-tile" type="button" onClick={() => onSelect(card)}>
      <div className="card-tile__image-wrap">
        {imageUrl ? (
          <img className="card-tile__image" src={imageUrl} alt={card.name} loading="lazy" />
        ) : (
          <div className="card-tile__placeholder">No image</div>
        )}
      </div>
      <div className="card-tile__body">
        <h3>{card.name}</h3>
        <div className="chip-row">
          {[...(card.elements ?? []), ...(card.types ?? []), ...(card.subtypes ?? [])].slice(0, 5).map((value) => (
            <span className="chip" key={value}>
              {value}
            </span>
          ))}
        </div>
        <p>{formatCardText(card.effect_raw ?? card.effect ?? '').slice(0, 150)}</p>
      </div>
    </button>
  );
};

export const CardGrid = ({ cards, onSelect }: CardGridProps) => {
  if (cards.length === 0) {
    return null;
  }

  return (
    <section className="card-grid" aria-label="Card search results">
      {cards.map((card) => (
        <CardTile card={card} key={card.uuid ?? card.slug} onSelect={onSelect} />
      ))}
    </section>
  );
};

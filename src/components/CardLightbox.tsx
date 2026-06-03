import { useEffect } from 'react';
import { buildCardImageUrl } from '../lib/gatcg/client';
import type { Card } from '../lib/gatcg/types';
import { formatCardText, formatList, getPrimaryEdition } from './cardDisplay';

type CardLightboxProps = {
  card: Card;
  isLoadingDetail: boolean;
  onClose: () => void;
};

const Stat = ({ label, value }: { label: string; value?: string | number | null }) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return (
    <div className="stat-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
};

export const CardLightbox = ({ card, isLoadingDetail, onClose }: CardLightboxProps) => {
  const edition = getPrimaryEdition(card);
  const imageUrl = buildCardImageUrl(edition?.image);
  const effectText = formatCardText(card.effect_raw ?? card.effect ?? edition?.effect_raw ?? edition?.effect ?? '');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.classList.add('has-lightbox');

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('has-lightbox');
    };
  }, [onClose]);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-labelledby="card-lightbox-title">
      <button className="lightbox__backdrop" type="button" aria-label="Close card details" onClick={onClose} />
      <article className="lightbox__panel">
        <button className="lightbox__close" type="button" onClick={onClose} aria-label="Close card details">
          Close
        </button>
        <div className="lightbox__image-column">
          {imageUrl ? <img src={imageUrl} alt={card.name} /> : <div className="lightbox__placeholder">No image available</div>}
        </div>
        <div className="lightbox__content">
          <p className="eyebrow">{formatList([...(card.elements ?? []), ...(card.classes ?? [])]) || 'Grand Archive card'}</p>
          <h2 id="card-lightbox-title">{card.name}</h2>
          <p className="type-line">{formatList([...(card.types ?? []), ...(card.subtypes ?? [])])}</p>

          <div className="stat-grid">
            <Stat label="Memory" value={card.cost_memory ?? card.cost?.value} />
            <Stat label="Reserve" value={card.cost_reserve} />
            <Stat label="Level" value={card.level} />
            <Stat label="Power" value={card.power} />
            <Stat label="Life" value={card.life} />
            <Stat label="Durability" value={card.durability} />
            <Stat label="Speed" value={card.speed} />
          </div>

          {effectText ? (
            <section className="detail-section">
              <h3>Effect</h3>
              <p className="effect-text">{effectText}</p>
            </section>
          ) : null}

          {card.flavor ? (
            <section className="detail-section">
              <h3>Flavor</h3>
              <p className="flavor-text">{card.flavor}</p>
            </section>
          ) : null}

          <section className="detail-section">
            <h3>Editions {isLoadingDetail ? <span className="loading-inline">refreshing...</span> : null}</h3>
            <div className="edition-list">
              {(card.editions ?? card.result_editions ?? []).slice(0, 8).map((item) => (
                <div className="edition-row" key={item.uuid ?? item.slug}>
                  <span>{item.set?.prefix ?? 'Set'} #{item.collector_number ?? '-'}</span>
                  <strong>{item.set?.name ?? item.slug ?? 'Unknown edition'}</strong>
                  {item.rarity !== null && item.rarity !== undefined ? <small>Rarity {item.rarity}</small> : null}
                </div>
              ))}
            </div>
          </section>
        </div>
      </article>
    </div>
  );
};

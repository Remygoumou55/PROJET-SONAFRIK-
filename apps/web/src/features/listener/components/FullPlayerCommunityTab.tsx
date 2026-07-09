"use client";

import { useEffect, useMemo, useState } from "react";
import { LiveReactions } from "./LiveReactions";

type ReviewSort = "helpful" | "recent" | "popular";

interface StoredReview {
  id: string;
  trackId: string;
  author: string;
  rating: number;
  text: string;
  createdAt: string;
  likes: number;
}

const STORAGE_KEY = "sonafrik.track-panel.reviews.v1";

function readStoredReviews(): StoredReview[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredReviews(reviews: StoredReview[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function averageRating(reviews: StoredReview[]) {
  if (reviews.length === 0) return 0;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Number((total / reviews.length).toFixed(1));
}

function ratingDistribution(reviews: StoredReview[]) {
  return [5, 4, 3, 2, 1].map((value) => {
    const count = reviews.filter((review) => review.rating === value).length;
    const percent = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
    return { value, count, percent };
  });
}

export function FullPlayerCommunityTab({
  trackId,
  trackTitle,
  artistName,
}: {
  trackId: string;
  trackTitle: string;
  artistName: string;
}) {
  const [reviews, setReviews] = useState<StoredReview[]>([]);
  const [sortBy, setSortBy] = useState<ReviewSort>("helpful");
  const [draftText, setDraftText] = useState("");
  const [draftRating, setDraftRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    const allReviews = readStoredReviews();
    setReviews(allReviews.filter((review) => review.trackId === trackId));
  }, [trackId]);

  const sortedReviews = useMemo(() => {
    const next = [...reviews];
    if (sortBy === "recent") {
      return next.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    }
    if (sortBy === "popular") {
      return next.sort((a, b) => b.likes - a.likes || Date.parse(b.createdAt) - Date.parse(a.createdAt));
    }
    return next.sort((a, b) => b.likes - a.likes || b.rating - a.rating);
  }, [reviews, sortBy]);

  const average = averageRating(reviews);
  const distribution = ratingDistribution(reviews);

  function submitReview() {
    const text = draftText.trim();
    if (draftRating === 0 && text.length === 0) return;

    const nextReview: StoredReview = {
      id: `${trackId}-${Date.now()}`,
      trackId,
      author: "Vous",
      rating: Math.max(1, draftRating || 4),
      text: text || `J'écoute "${trackTitle}" en boucle sur SONAFRIK.`,
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    const allReviews = [...readStoredReviews().filter((review) => review.id !== nextReview.id), nextReview];
    writeStoredReviews(allReviews);
    setReviews(allReviews.filter((review) => review.trackId === trackId));
    setDraftText("");
    setDraftRating(0);
    setHoverRating(0);
  }

  function likeReview(id: string) {
    const allReviews = readStoredReviews().map((review) =>
      review.id === id ? { ...review, likes: review.likes + 1 } : review,
    );
    writeStoredReviews(allReviews);
    setReviews(allReviews.filter((review) => review.trackId === trackId));
  }

  return (
    <div className="fpp-community">
      <section className="fpp-community-hero">
        <div className="fpp-community-score">
          <span className="fpp-community-score__value">{average > 0 ? average.toFixed(1) : "—"}</span>
          <div className="fpp-community-score__meta">
            <div className="fpp-rating-stars fpp-rating-stars--display" aria-label={`Note moyenne ${average || 0} sur 5`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`fpp-star${average >= star - 0.4 ? " fpp-star--filled" : ""}`}
                  aria-hidden="true"
                >
                  ★
                </span>
              ))}
            </div>
            <p className="fpp-community-score__label">
              {reviews.length > 0 ? `${reviews.length} avis de la communauté` : `Aucun avis pour ${artistName} pour le moment`}
            </p>
          </div>
        </div>

        <div className="fpp-community-bars" aria-label="Répartition des notes">
          {distribution.map((item) => (
            <div key={item.value} className="fpp-community-bar">
              <span className="fpp-community-bar__label">{item.value}★</span>
              <div className="fpp-community-bar__track">
                <div className="fpp-community-bar__fill" style={{ width: `${item.percent}%` }} />
              </div>
              <span className="fpp-community-bar__count">{item.count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="fpp-community-live">
        <div className="fpp-section-head">
          <div>
            <p className="fpp-section-head__eyebrow">Communauté en direct</p>
            <h3 className="fpp-section-head__title">Réactions SONAFRIK</h3>
          </div>
        </div>
        <LiveReactions />
      </section>

      <section className="fpp-community-compose">
        <div className="fpp-section-head">
          <div>
            <p className="fpp-section-head__eyebrow">Votre voix</p>
            <h3 className="fpp-section-head__title">Que penses-tu de ce morceau ?</h3>
          </div>
        </div>

        <div
          className="fpp-rating-stars fpp-rating-stars--interactive"
          role="group"
          aria-label="Donner une note sur 5 étoiles"
          onMouseLeave={() => setHoverRating(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`fpp-star-btn${star <= (hoverRating || draftRating) ? " active" : ""}`}
              onClick={() => setDraftRating(star === draftRating ? 0 : star)}
              onMouseEnter={() => setHoverRating(star)}
              aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
              aria-pressed={star <= draftRating}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          className="fpp-comment-input"
          placeholder="Écris un avis utile, sincère et constructif pour la communauté SONAFRIK."
          value={draftText}
          onChange={(event) => setDraftText(event.target.value)}
          rows={4}
          maxLength={600}
          aria-label="Ton commentaire"
        />

        <div className="fpp-community-compose__footer">
          <span className="fpp-community-compose__hint">
            Les avis sont conservés sur cet appareil pour enrichir votre expérience d&apos;écoute.
          </span>
          <button
            type="button"
            className="fpp-comment-submit"
            disabled={draftRating === 0 && draftText.trim().length === 0}
            onClick={submitReview}
          >
            Publier mon avis
          </button>
        </div>
      </section>

      <section className="fpp-community-reviews">
        <div className="fpp-section-head">
          <div>
            <p className="fpp-section-head__eyebrow">Avis & commentaires</p>
            <h3 className="fpp-section-head__title">Retours de la communauté</h3>
          </div>

          <label className="fpp-sort-select">
            <span>Trier</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as ReviewSort)} aria-label="Trier les avis">
              <option value="helpful">Les plus utiles</option>
              <option value="recent">Les plus récents</option>
              <option value="popular">Les plus populaires</option>
            </select>
          </label>
        </div>

        {sortedReviews.length === 0 ? (
          <div className="fpp-empty-state fpp-empty-state--sm">
            <p>Sois le premier à laisser un avis sur ce morceau.</p>
          </div>
        ) : (
          <div className="fpp-review-list">
            {sortedReviews.map((review) => (
              <article key={review.id} className="fpp-review-card">
                <div className="fpp-review-card__avatar" aria-hidden="true">
                  {review.author.slice(0, 1).toUpperCase()}
                </div>
                <div className="fpp-review-card__body">
                  <header className="fpp-review-card__header">
                    <div>
                      <strong className="fpp-review-card__name">{review.author}</strong>
                      <div className="fpp-rating-stars fpp-rating-stars--display" aria-hidden="true">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`fpp-star${review.rating >= star ? " fpp-star--filled" : ""}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <time className="fpp-review-card__date" dateTime={review.createdAt}>
                      {formatDate(review.createdAt)}
                    </time>
                  </header>

                  <p className="fpp-review-card__text">{review.text}</p>

                  <div className="fpp-review-card__actions">
                    <button type="button" className="fpp-inline-action" onClick={() => likeReview(review.id)}>
                      👍 Utile {review.likes > 0 ? `(${review.likes})` : ""}
                    </button>
                    <button type="button" className="fpp-inline-action" disabled>
                      Répondre
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

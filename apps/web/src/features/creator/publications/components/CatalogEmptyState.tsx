"use client";

import { memo } from "react";

export const CatalogEmptyState = memo(function CatalogEmptyState() {
  return (
    <section className="pub-catalog-empty" aria-labelledby="pub-catalog-empty-title">
      <div className="pub-catalog-empty__visual" aria-hidden="true">
        <span className="pub-catalog-empty__ring pub-catalog-empty__ring--outer" />
        <span className="pub-catalog-empty__ring pub-catalog-empty__ring--inner" />
        <span className="pub-catalog-empty__icon">♪</span>
      </div>
      <h2 id="pub-catalog-empty-title" className="pub-catalog-empty__title">
        Votre catalogue est vide
      </h2>
      <p className="pub-catalog-empty__description">
        Toutes vos œuvres apparaîtront ici. Vous pourrez suivre leur validation, leurs performances
        et gérer votre catalogue depuis cette page.
      </p>
    </section>
  );
});

# SRTSP Phase 3.1 — Publication Wizard Event Map

**Package :** `@sonafrik/realtime` v3.1.0  
**Date :** 2026-07-05

## Cartographie officielle

| Action Wizard | Événement SRTSP | Constante |
|---|---|---|
| Étape 1 — création single | `publication.draft.created` | `PUBLICATION_DRAFT_CREATED` |
| Métadonnées re-sauvegardées | `publication.draft.updated` | `PUBLICATION_DRAFT_UPDATED` |
| Étape 2 — upload audio | `publication.audio.uploaded` | `PUBLICATION_AUDIO_UPLOADED` |
| Étape 2 — pochette | `publication.cover.uploaded` | `PUBLICATION_COVER_UPLOADED` |
| Étape 3 — métadonnées | `publication.metadata.completed` | `PUBLICATION_METADATA_COMPLETED` |
| Étape 4 — soumission | `publication.submitted` | `PUBLICATION_SUBMITTED` |
| Abandon (retour étape 1) | `publication.cancelled` | `PUBLICATION_CANCELLED` |
| Suppression (réservé) | `publication.deleted` | `PUBLICATION_DELETED` |

## Payload (`publicationWizardPayloadSchema`)

```typescript
{
  albumId: uuid;
  trackId: uuid;
  creatorId: uuid;
  title?: string; // max 200
}
```

## Destinations par défaut

| Événement | Destinations |
|---|---|
| draft.* / audio / cover / metadata | `publications`, `catalog` |
| submitted | `publications`, `admin`, `dashboard` |
| cancelled / deleted | `publications`, `catalog` |

## Intégration Wizard

- Hook : `usePublicationWizardSrtsp()` → `createPublicationWizardPublisher(publish)`
- Émission **après succès API uniquement** — logique métier inchangée
- Aucune référence aux autres modules

# Publication Events — Phase 4.5

Événements **métier orchestration** — pas d'événements UI.

| Event | Moment |
|---|---|
| `PublicationRequested` | Début `preparePublication` |
| `PublicationValidated` | Après validation metadata |
| `PublicationPrepared` | Package construit |
| `PublicationReady` | Succès final dry-run |
| `PublicationCancelled` | Échec (avec `reason`) |

Publisher : `InMemoryPublicationEventPublisher` (tests) / interface `PublicationEventPublisher` (injection).

Aucun événement ne déclenche de publication catalog en Phase 4.5.

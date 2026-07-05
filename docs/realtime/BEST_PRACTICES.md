# SRTSP — Best Practices

## DO

- Publier via `engine.publish()` ou helpers domaine
- Typer payloads via EventRegistry
- Utiliser `dedupeKey` métier stable
- S'abonner via hooks React (cleanup auto)
- Forward LDSE → SRTSP via bridge (intégration progressive)

## DON'T

- Modifier directement l'état d'un autre module
- Contourner RLS via payload (`service_role`, `bypass_rls` filtrés)
- Modifier modules certifiés (Wizard, Mes publications UI)
- Implémenter logique métier dans le bus
- Toucher Session Engine (`packages/api/src/streaming/session/` — LOCKED)

## Intégration progressive

1. **Phase 1 (actuelle)** — Infrastructure + bridge LDLE
2. **Phase 2** — Supabase Realtime adapter branché
3. **Phase 3** — Modules consomment `useLiveQuery` directement
4. **Phase 4** — Retrait progressif du bridge LDSE

## Performance

- Déduplication TTL 30s par défaut
- Unsubscribe obligatoire (hooks gèrent via useEffect)
- Virtualisation UI reste responsabilité des pages

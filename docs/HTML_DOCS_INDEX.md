# Index documentation HTML

> **Problème audit #18** — guides HTML opérationnels dans `docs/`.

---

## Guides live / contrôle

| Fichier | Usage |
|---|---|
| [`GUIDE_LIVE_CONTROL_REMY.html`](./GUIDE_LIVE_CONTROL_REMY.html) | Checklist live control streaming |
| [`LOCAL_CONTROL_LINKS.md`](./LOCAL_CONTROL_LINKS.md) | Liens dev local (généré par script) |

## Génération liens locaux

```powershell
node apps/web/scripts/fetch-control-links.mjs
```

## Note CI

Les HTML ne sont pas lintés par ESLint. Vérification manuelle avant démo live. Ne pas committer de secrets dans les HTML.

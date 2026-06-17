# MEMORY.md — décisions & pièges du proto ZLV

Mémo des décisions structurantes et des pièges rencontrés, pour reprendre vite.
(Guide complet : [CLAUDE.md](CLAUDE.md) · doc utilisateur : [README.md](README.md))

## Décisions structurantes

- **Repo allégé, pas full monorepo** : `frontend/` + `models`/`schemas`/`utils`/`pdf` seulement.
- **MSW en mode navigateur** : on réutilise les handlers de test de ZLV (`frontend/src/mocks/handlers/`)
  via `setupWorker`, plus un seed déterministe. Zéro backend.
- **Auto-login** : on écrit un `authUser` valide (avec un JWT signé par un shim) dans le localStorage
  avant l'init du store.
- **Déploiement** : GitHub Pages, base path `/zlv-test-feature-verif/`, fallback SPA via `404.html`.
- **Seed** : établissement **Lorient Agglomération** (codes INSEE réels), majorité de logements
  **vacants** (LOVAC 2023–2026), minorité **en location** (fichiers fonciers 2023, sans occupation
  prévisionnelle).
- **Feature flag** : `group-housing-review` (dans `frontend/.env`).

## Pièges résolus (à ne pas refaire)

1. **CORS / mutations qui échouent en prod** — La page et l'API mockée doivent être **same-origin**,
   sinon les PUT/POST déclenchent un preflight CORS que le service worker MSW (en `onUnhandledRequest:
   'bypass'`) laisse filer → `FETCH_ERROR` → toasts d'erreur. Invisible en test (MSW node, pas de SW).
   → `config.apiEndpoint` = `window.location.origin + import.meta.env.BASE_URL + 'api'`
   (`frontend/src/utils/config.ts`). Ne pas remettre une origine absolue type `http://localhost:3001`.

2. **Modules Node dans les handlers** — `node:http2` (constantes HTTP) et `jsonwebtoken` cassent le
   bundle navigateur → shims dans `frontend/src/mocks/shims/`, aliasés dans `vite.config.mts`
   **uniquement hors test** (`process.env.VITEST !== 'true'`).

3. **Dépendance fantôme** — `lodash-es` venait de `server/` (retiré) ; déclarée explicitement dans
   `frontend/package.json`.

4. **Rebuild des packages** — Après modif de `packages/models` (ex : nouveau type d'événement
   `housing:verified`), rebuild `@zerologementvacant/models` + redémarrer Vite, sinon `dist/lib`
   obsolète → types/exports manquants au runtime.

5. **`<gauge-chart>` (DSFR Charts)** — Web-component Vue : pas de texte custom, warning `array<object>`,
   ne charge pas sous happy-dom. → remplacé par une **barre custom** (`ReviewProgressBar`) au style
   jauge DSFR (track `background-raised-grey`, coins carrés, bordure) avec texte « X logement vérifié
   sur N » lisible. Dépendance `@gouvfr/dsfr-chart` encore installée mais **non utilisée**.

6. **Couleurs vertes de la liste de revue** — sélection (non vérifiée) = `background.alt.blueFrance`
   (bleu/gris) ; vérifié = `var(--green-bourgeon-975)` ; le vert vif `green-bourgeon-950` a été rejeté.

7. **Modales d'ajout de propriétaire** — `createOwnerSearchModal`/`createOwnerAttachmentModal` ont des
   **id fixes** → paramétrés (`id` optionnel) pour pouvoir les réutiliser dans l'écran de revue sans
   collision avec `HousingOwnersView`.

8. **`EventCard` exhaustif** — `IndividualEventCard`/`AggregatedEventCard` utilisent `ts-pattern
   .exhaustive()` → ajouter un `EventType` **oblige** à ajouter le case (sinon crash runtime).

## État au moment de la reprise

- Tout est mergé sur `main` et déployé. PRs #1 (feature + corrections) et #2 (seed Lorient) mergées.
- Branche `feat/group-housing-review` mergée (peut être supprimée).

## Pistes / différé

- L'événement « Vérification » liste les modifs des **champs logement** (occupation, statut,
  sous-statut, DPE renseigné, précisions, note). Les **changements de rang propriétaire** (sauvegardés
  via le side-panel, flux séparé) ne sont pas encore inclus dans la liste.
- Le `postbuild` de génération d'images de bâtiments (sharp) n'est pas exécuté (console errors bénins).

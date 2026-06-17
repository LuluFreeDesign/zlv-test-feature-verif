# CLAUDE.md — ZLV prototype d'environnement de test

Guide pour Claude (et l'équipe) quand on reprend ce dépôt.

## C'est quoi ce dépôt

Réplique **allégée et jetable** du frontend de [Zéro Logement Vacant](https://zerologementvacant.beta.gouv.fr),
qui tourne **sans backend** (toute l'API est mockée par **MSW** côté navigateur, avec de fausses
données) pour faire **tester de nouvelles fonctionnalités à des usagers**.

- Mini-monorepo Yarn 4 + Nx : `frontend/` + 4 packages internes (`models`, `schemas`, `utils`, `pdf`).
- Stack : React 18, Vite 8, TypeScript, DSFR (`@codegouvfr/react-dsfr`) + MUI/Emotion, RTK Query.
- Déployé en statique sur **GitHub Pages** : https://lulufreedesign.github.io/zlv-test-feature-verif/

> Ce n'est **pas** le dépôt de production ZLV. C'est un snapshot du frontend + une couche démo.

## Lancer en local

Node 24 + Yarn 4 (corepack). Le frontend tourne sur **http://localhost:3002**.

```bash
corepack enable
yarn install
yarn dsfr             # copie les assets DSFR dans public/ (sinon page non stylée)
yarn build:packages   # build des 4 packages internes
yarn dev:demo         # démarre Vite (port 3002)
```

Auto-login : les testeurs arrivent directement dans l'app. Compte démo
`demo@zerologementvacant.beta.gouv.fr` (login accepte n'importe quel identifiant).

## Build / test / déploiement

```bash
yarn nx build frontend --skip-nx-cache   # build prod (rebuild les packages d'abord)
yarn nx test frontend --skip-nx-cache    # suite Vitest (MSW en mode node)
```

Le push sur `main` déclenche le workflow `.github/workflows/deploy-pages.yml` (build + deploy Pages).
Le workflow passe `VITE_BASE_PATH=/zlv-test-feature-verif/`.

## Architecture du mode démo (le cœur)

- Flag `VITE_DEMO_MODE=true` (dans `frontend/.env`, committé) → `frontend/src/index.tsx` démarre MSW
  **dans le navigateur**, seed les données, puis fait l'auto-login **avant** d'importer le store.
- `frontend/src/mocks/` :
  - `seed.ts` — jeu de fausses données **déterministe** (faker seedé). Établissement = **Angers Loire
    Métropole** ; logements localisés sur la commune de **Savennières** (rues réelles + coordonnées
    réelles pour la carte), ~30 logements (majorité vacants/LOVAC, minorité en location/FF 2023),
    propriétaires, groupes, campagne, notes.
  - `browser.ts` — `setupWorker(...demoHandlers, ...handlers)`.
  - `start.ts` — seed → écrit `authUser` (localStorage) → `worker.start()`.
  - `handlers/` — handlers MSW (réutilisés des tests) + `data.ts` (store en mémoire).
  - `shims/` — shims navigateur pour `node:http2` et `jsonwebtoken` (aliasés en non-test dans `vite.config.mts`).
- **API same-origin** : `config.apiEndpoint` est résolu en `window.location.origin + BASE_URL + 'api'`
  (voir `frontend/src/utils/config.ts`, `resolveApiEndpoint`). **Indispensable** : sinon les
  mutations (PUT/POST) déclenchent un preflight CORS que le service worker laisse filer → échec.

## La fonctionnalité (derrière le flag `group-housing-review`)

« Passer en revue les logements » depuis un groupe. Activée via `VITE_FEATURE_FLAGS=group-housing-review`.

- Page groupe (`components/Group/GroupNext.tsx`) : dropdown **« Actions »** + barre de progression
  + « Continuer le passage en revue ».
- Écran (`views/Group/GroupHousingReviewView.tsx`, route `/groupes/:id/passer-en-revue`) :
  liste des logements + édition (propriétaires/rang, occupation, statut, précisions, note, DPE).
- Persistance « vérifié » : `utils/housingReview.ts` + `hooks/useHousingReview.ts` (localStorage, par
  groupe).
- Événement « Vérification » dans l'historique du logement : type `housing:verified`
  (`packages/models`), carte `components/EventsHistory/events/HousingVerifiedEventCard.tsx`, créé via
  `POST /housing/:id/events` (mock).

## Conventions

- DSFR d'abord, MUI pour le layout, Emotion `styled()` pour le custom. Jamais de hex en dur (tokens
  `fr.colors.*` ou variables CSS DSFR). Apostrophe française `’`.
- RTK Query pour le serveur, Redux pour l'UI globale.
- **Tests** : la suite héritée de ZLV sert de filet anti-régression quand on touche un composant
  **partagé** ; pas de TDD cérémonieux sur les features jetables du proto (validation = test navigateur).

## Pièges (⚠️)

- **Après toute modif dans `packages/models` (ou schemas/utils/pdf)** : `yarn nx build
  @zerologementvacant/models --skip-nx-cache` puis **redémarrer Vite** (le frontend lit le `dist/lib`).
- **`public/dsfr/`** est gitignored → relancer `yarn dsfr` après un `yarn install` propre.
- L'API doit rester **same-origin** (voir ci-dessus).
- Détails et décisions : voir [MEMORY.md](MEMORY.md).

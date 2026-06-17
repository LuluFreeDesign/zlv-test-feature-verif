# ZLV — Environnement de test de fonctionnalité

Réplique **iso** de l'interface de [Zéro Logement Vacant](https://zerologementvacant.beta.gouv.fr),
qui tourne **sans backend ni base de données**, avec de **fausses données** réalistes, pour faire
tester de nouvelles fonctionnalités à des usagers.

> ⚠️ Ce dépôt est un **snapshot jetable** du frontend ZLV (allégé : `frontend/` + 4 packages
> internes). Ce n'est pas le dépôt de production.

## Comment ça marche

- Le frontend ZLV passe par **RTK Query** pour tous ses appels API.
- En **mode démo** (`VITE_DEMO_MODE=true`), on démarre **Mock Service Worker (MSW)** dans le
  navigateur : il intercepte tous les appels réseau et répond avec un jeu de fausses données injecté
  au démarrage. Aucun serveur n'est nécessaire.
- L'infrastructure de mock (`frontend/src/mocks/handlers/`) est celle déjà utilisée par les tests :
  on la réutilise telle quelle, on l'active juste côté navigateur.

### Pièces ajoutées pour la démo (tout est isolé, donc facile à resynchroniser avec ZLV)

| Fichier | Rôle |
|---|---|
| `frontend/src/mocks/seed.ts` | Injecte un graphe cohérent de fausses données : **Lorient Agglomération**, ~30 logements (majorité vacants/LOVAC 2023–2026, minorité en location/FF 2023), propriétaires, groupes, campagne, notes. Seed faker **déterministe** → données reproductibles. |
| `frontend/src/mocks/browser.ts` | Démarre MSW en mode navigateur (`setupWorker`). |
| `frontend/src/mocks/demo-handlers.ts` | Override du login : **n'importe quel identifiant** fonctionne, renvoie un vrai JWT. |
| `frontend/src/mocks/start.ts` | Orchestration : seed → **auto-login** (écrit `authUser` dans le localStorage) → démarre le worker. |
| `frontend/src/mocks/shims/` | Shims navigateur pour `node:http2` et `jsonwebtoken` (utilisés par les handlers, non bundlables sinon). |
| `frontend/src/render-app.tsx` | Arbre de rendu React (sorti de `index.tsx`). |
| `frontend/src/index.tsx` | Bootstrap : en mode démo, attend le seed + le worker **avant** d'importer le store et de rendre. |
| `frontend/public/mockServiceWorker.js` | Le service worker MSW (généré par `msw init`). |

Hors mode démo, tous les `./mocks/*` sont importés dynamiquement → **code-splittés hors du bundle**
de production normal.

## Lancer en local

Pré-requis : Node 24, Yarn 4 (via corepack).

```bash
corepack enable
yarn install
yarn dsfr            # copie les assets DSFR dans public/ (sinon page non stylée)
yarn build:packages  # build des 4 packages internes
yarn dev:demo        # démarre Vite (http://localhost:3002)
```

Les testeurs arrivent **directement** dans l'application (auto-login), sur le parc de logements.

## Déploiement (GitHub Pages)

Un workflow (`.github/workflows/deploy-pages.yml`) build et déploie automatiquement à chaque push
sur `main`.

1. Dans **Settings → Pages** du dépôt GitHub, choisir **Source : GitHub Actions**.
2. Pousser sur `main`.
3. Le site est servi sous `https://lulufreedesign.github.io/zlv-test-feature-verif/`.

Le base path (`/zlv-test-feature-verif/`) est géré via `VITE_BASE_PATH` (routeur + assets + scope du
service worker).

## Fonctionnalité en test : « Passer en revue les logements »

Derrière le feature flag `group-housing-review`. Depuis une page groupe, le bouton **« Actions »**
ouvre l'écran de revue (`/groupes/:id/passer-en-revue`) où l'usager vérifie/édite chaque logement
(propriétaires & rangs, occupation, statut/sous-statut, précisions, note, DPE), puis **« Enregistre et
passe au suivant »**.

- Progression « vérifié » **par groupe** (localStorage) → barre de progression + « Continuer le
  passage en revue » sur la page groupe.
- À chaque vérification, un événement **« Vérification »** (badge green-bourgeon) apparaît dans
  l'onglet « Notes et historique » du logement, avec la liste des modifications (bouton « Voir plus »).

Fichiers clés : `views/Group/GroupHousingReviewView.tsx`, `components/HousingReview/*`,
`components/EventsHistory/events/HousingVerifiedEventCard.tsx`, `hooks/useHousingReview.ts`,
`utils/housingReview.ts`.

## Ajouter une autre fonctionnalité

Le routing ZLV gère déjà les feature flags via `FeatureFlagLayout` (voir `frontend/src/App.tsx`).
Pour brancher une nouvelle fonctionnalité :

1. Développer la vue/le composant dans `frontend/src/`.
2. Si besoin de nouvelles données, les ajouter dans `frontend/src/mocks/seed.ts` (et un handler dans
   `frontend/src/mocks/handlers/` si un nouvel endpoint est appelé).
3. Activer le flag dans `frontend/.env` :
   ```
   VITE_FEATURE_FLAGS=mon-nouveau-flag
   ```
4. Conditionner la route/le composant à ce flag (`FeatureFlagLayout flag="mon-nouveau-flag" ...`).

## Identifiants de démo

- Auto-login activé : pas besoin de se connecter.
- Si déconnexion : l'écran de login accepte **n'importe quel email + mot de passe**.
- Compte de démo : `demo@zerologementvacant.beta.gouv.fr`.

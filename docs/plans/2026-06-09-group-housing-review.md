# Plan — Passage en revue des logements d'un groupe

## Context

Nouvelle fonctionnalité à faire tester aux usagers dans le prototype ZLV (frontend-only,
données MSW, pas de backend). Depuis une **page groupe**, l'usager peut lancer un **passage en
revue** des logements du groupe : un écran dédié où il vérifie/édite, logement par logement, les
données propriétaires et logement, puis valide chaque logement (« Enregistrer et passer au
suivant »). La progression est suivie par une jauge, et l'état « vérifié » est conservé par
groupe.

Tout est derrière un **feature flag** `group-housing-review` (activable via `VITE_FEATURE_FLAGS`).

## Décisions validées (Lucas)

- **Process** : plan direct → validation → implémentation.
- **Barre de progression** : composant **`<gauge-chart>`** de `@gouvfr/dsfr-chart` (la « Jauge »).
- **État « vérifié »** : persistant via **localStorage**, par couple **(groupe, logement)**.
- **Libellé du bouton dropdown** : **« Actions »** (fidèle au Figma).

## Périmètre

Inclus : dropdown « Actions », écran de revue complet (liste gauche, formulaire centre, colonne
droite), réutilisation des composants d'édition existants, jauge de progression (écran + page
groupe), persistance « vérifié », garde « modifications non enregistrées », validations DSFR.

**Exclus** (champs inexistants aujourd'hui, demande PO) : « Source de l'information sur
l'occupation actuelle » et « Référence cadastrale ».

---

## Architecture

### Routing & feature flag
- Nouvelle route `/* /groupes/:id/passer-en-revue */` dans `frontend/src/App.tsx`, enveloppée par
  `FeatureFlagLayout flag="group-housing-review"` (`then={<GroupHousingReviewView/>}`,
  `else={<NotFoundView/>}`).
- Ajouter `'group-housing-review'` à l'union `AvailableFeatureFlag` dans
  `frontend/src/layouts/FeatureFlagLayout.tsx`.
- Activer le flag dans `frontend/.env` : `VITE_FEATURE_FLAGS=group-housing-review`.

### Persistance de l'état « vérifié »
Nouveau util/hook `frontend/src/hooks/useHousingReview.ts` :
- Clé localStorage `zlv-demo:review:<groupId>` → `{ started: boolean, verified: string[] }` (ids de
  logements vérifiés).
- API : `useHousingReview(groupId)` → `{ started, verifiedIds, isVerified(housingId), markVerified(housingId), startReview(), progress: {done, total} }`.
- Keyé par groupe → un logement vérifié dans le groupe A n'est pas vérifié dans le groupe B
  (exigence PO) **par construction**.

### Récupération des logements du groupe (MSW)
- Étendre le handler `find` **et** `count` de `frontend/src/mocks/handlers/housing-handlers.ts`
  pour gérer le filtre **`groupIds`** (lecture de `data.groupHousings`). Corrige aussi un écart
  existant du mock (la page groupe affiche aujourd'hui tous les logements).
- L'écran de revue récupère les logements via le hook RTK existant `useFindHousingQuery({ filters: { groupIds: [groupId] } })`
  (chaque entité contient déjà `owner` = propriétaire principal).

---

## Composants — création & réutilisation

### Page groupe — `frontend/src/components/Group/GroupNext.tsx` (modifié)
- Remplacer le bouton « Créer une campagne » (et le bloc des 3 boutons) par un **`Dropdown`**
  (`~/components/Dropdown/Dropdown`) intitulé **« Actions »** avec deux entrées :
  - « Créer une campagne » → comportement existant (`campaignFromGroupModal.open()`).
  - « Passer en revue les logements » → `navigate('/groupes/:id/passer-en-revue')`, gated par le flag.
  - (« Exporter », « Supprimer le groupe » conservés dans le menu ou à côté, selon le Figma.)
- Ajouter, sous l'en-tête, quand `review.started` : la **jauge** « X logements vérifiés sur Y » +
  bouton **« Continuer le passage en revue »** (→ route de revue).

### Écran de revue — nouveaux fichiers
- `frontend/src/views/Group/GroupHousingReviewView.tsx` — vue principale (orchestration).
- `frontend/src/components/HousingReview/ReviewHousingList.tsx` — colonne gauche « Logements à
  vérifier » (adresse + propriétaire principal ; surbrillance verte + coche + badge « vérifié »
  pour les logements enregistrés ; sélection).
- `frontend/src/components/HousingReview/ReviewHousingForm.tsx` — formulaire central + colonne
  droite (react-hook-form + yup).
- `frontend/src/components/ui/GaugeChart/GaugeChart.tsx` — wrapper React du web-component
  `<gauge-chart>` (+ déclaration JSX ambiante, pas de types fournis par la lib).

### Réutilisations (ne PAS recréer)
| Bloc UI | Composant réutilisé | Fichier |
|---|---|---|
| Dropdown « Actions » | `Dropdown` | `components/Dropdown/Dropdown.tsx` |
| Tableau propriétaires (colonnes réduites `['name','rank','actions']`) | `HousingOwnerTable` | `components/Owner/HousingOwnerTable.tsx` |
| Side-panel « Éditer » (rang + infos) | `HousingOwnerEditionAside` | `components/Owner/HousingOwnerEditionAside.tsx` |
| Hook propriétaires d'un logement | `useHousingOwners(housingId)` | `components/Owner/useHousingOwners.tsx` |
| « + Ajouter un propriétaire » | modales d'ajout existantes | `components/Owner/HousingOwnerAdditionModals/*` |
| Occupation actuelle / prévisionnelle | `OccupancySelect` | `components/HousingListFilters/OccupancySelect.tsx` |
| Statut de suivi | `HousingStatusSelect` | `components/HousingListFilters/HousingStatusSelect.tsx` |
| Sous-statut de suivi | `HousingSubStatusSelect` | `components/HousingListFilters/HousingSubStatusSelect.tsx` |
| Précisions (blocage / évolutions / dispositifs) | `PrecisionLists` | `components/Precision/PrecisionLists.tsx` |
| DPE renseigné (éditable) | `EnergyConsumptionSelect` | `components/HousingListFilters/EnergyConsumptionSelect.tsx` |
| DPE ADEME (lecture seule) | `DPE` | `components/DPE/DPE.tsx` |
| Carte | `Map` | `components/Map/Map.tsx` |
| Mapping statut→sous-statut + validation | `HousingStates`, `getSubStatusOptions` | `models/HousingState.tsx` |

### Mutations / services réutilisés
- `useUpdateHousingMutation` (`PUT /housing/:id`) : occupancy, occupancyIntended, status, subStatus,
  actualEnergyConsumption.
- `useSaveHousingPrecisionsMutation` (`PUT /housing/:id/precisions`).
- `useCreateNoteByHousingMutation` (`POST /housing/:id/notes`) — uniquement si note non vide.
- `useUpdateHousingOwnersMutation` (`PUT /housing/:id/owners`) — via le side-panel (sauvegarde
  immédiate, indépendante du bouton principal). Handler MSW déjà présent.

---

## Comportements clés

### « Enregistrer et passer au suivant »
1. `form.handleSubmit` → validation yup (dont **sous-statut requis** si le statut en a — erreur
   DSFR au niveau du champ).
2. Appels : `updateHousing` + `saveHousingPrecisions` + `createNote` (si note saisie).
3. `markVerified(housingId)` (localStorage) → le logement passe **vert + coche + badge
   « vérifié »** dans la liste gauche, badge « vérifié » à droite du titre.
4. Avance au **logement suivant** (prochain de la liste / prochain non vérifié). Les flèches ↑↓ de
   l'en-tête naviguent aussi.

### Garde « modifications non enregistrées »
- Suivi via `form.formState.isDirty`.
- Déclencheurs : (a) sélection d'un autre logement dans la liste, (b) clic « Revenir au groupe » /
  navigation sortante. → **modale de confirmation** (`createConfirmationModal` DSFR) : « Vous
  risquez de perdre les modifications en cours ». Si confirmé : on abandonne la saisie (pas
  d'enregistrement) et on poursuit l'action.
- La **note** ne s'enregistre qu'au clic du bouton principal (idem précisions / champs).

### Jauge de progression (`<gauge-chart>`)
- En-tête de l'écran : `value={verifiedCount}` `init={0}` `target={total}`, légende « X logements
  vérifiés sur Y ».
- Page groupe : même jauge quand `review.started`.
- Intégration : `import '@gouvfr/dsfr-chart/GaugeChart'` (+ CSS) une fois ; wrapper React qui pose
  les attributs sur l'élément custom. Déclaration `declare module ... JSX.IntrinsicElements` pour
  `gauge-chart`. Ajouter la dépendance `@gouvfr/dsfr-chart@2.1.1` au `frontend/package.json`.

---

## Tests (TDD — écrits avant l'implémentation)

1. **Util** `hooks/test/useHousingReview.test.ts` : markVerified persiste, isolation par groupe,
   progress, `started`.
2. **Composant** `components/Group/test/GroupNext.test.tsx` (ou existant étendu) : le dropdown
   « Actions » affiche les 2 entrées ; « Passer en revue » gated par flag ; navigation.
3. **Vue (intégration)** `views/Group/test/GroupHousingReviewView.test.tsx` (pattern
   `GroupViewNext.test.tsx` + MSW) :
   - rend la liste des logements du groupe + propriétaire principal ;
   - « Enregistrer et passer au suivant » → logement marqué vérifié (badge) + avance ;
   - statut nécessitant un sous-statut sans sous-statut → **erreur de champ** ;
   - sélection d'un autre logement avec formulaire modifié → **modale d'avertissement** ;
   - clic « Éditer » propriétaire → ouvre le side-panel (rang éditable).

Lancement : `yarn nx test frontend -- <pattern>` (Vitest + MSW).

---

## Vérification finale
- `yarn nx build frontend` OK (bundle navigateur, dont le web-component dsfr-chart).
- `yarn dev:demo` → page groupe : dropdown « Actions » ; lancer une revue ; éditer un logement ;
  « Enregistrer et passer au suivant » → vert + badge + jauge qui progresse ; revenir au groupe →
  jauge + « Continuer » ; recharger → progression conservée (localStorage) ; logement vérifié dans
  un autre groupe → non vérifié.
- Comparaison visuelle avec les 3 captures Figma (parité 1:1).

## Étapes d'implémentation (ordre)
1. Dépendance `@gouvfr/dsfr-chart` + wrapper `GaugeChart` + flag/route/.env.
2. `useHousingReview` (+ test).
3. Étendre MSW `find`/`count` pour `groupIds` (+ test).
4. Dropdown « Actions » sur `GroupNext` + jauge/« Continuer » page groupe (+ test).
5. `GroupHousingReviewView` + `ReviewHousingList` + `ReviewHousingForm` (réutilisations) (+ tests).
6. Garde modifications non enregistrées + validations.
7. Vérification (build + dev + parité Figma).

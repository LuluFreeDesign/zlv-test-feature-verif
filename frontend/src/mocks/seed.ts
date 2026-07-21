import { faker } from '@faker-js/faker/locale/fr';
import {
  type CampaignDTO,
  type EstablishmentDTO,
  type GroupDTO,
  type HousingDTO,
  HousingStatus,
  Occupancy,
  type OwnerDTO,
  type UserDTO,
  UserRole
} from '@zerologementvacant/models';
import {
  genCampaignDTONext,
  genEstablishmentDTO,
  genGroupDTO,
  genHousingDTO,
  genNoteDTO,
  genOwnerDTO,
  genUserDTO
} from '@zerologementvacant/models/fixtures';

import data from './handlers/data';

/**
 * Email of the demo "current user". The login screen accepts this email (any
 * password); it is also the account auto-logged-in at boot.
 */
export const DEMO_EMAIL = 'demo@zerologementvacant.beta.gouv.fr';

/**
 * Number of housings to generate, spread across every commune of the EPCI
 * (weighted by population, so Tours concentrates most of them).
 */
const HOUSING_COUNT = 300;

// Communes de Tours Métropole Val de Loire (SIREN 243700754) — source geo.api.gouv.fr.
// geoCode INSEE, code postal principal et coordonnées du centre (réels) pour la carte.
const EPCI_COMMUNES: ReadonlyArray<{
  geoCode: string;
  postalCode: string;
  city: string;
  center: { latitude: number; longitude: number };
  population: number;
}> = [
  { geoCode: '37261', postalCode: '37000', city: 'Tours', center: { latitude: 47.3943, longitude: 0.6949 }, population: 139259 },
  { geoCode: '37122', postalCode: '37300', city: 'Joué-lès-Tours', center: { latitude: 47.3374, longitude: 0.6544 }, population: 38423 },
  { geoCode: '37214', postalCode: '37540', city: 'Saint-Cyr-sur-Loire', center: { latitude: 47.4188, longitude: 0.6554 }, population: 17029 },
  { geoCode: '37233', postalCode: '37700', city: 'Saint-Pierre-des-Corps', center: { latitude: 47.3876, longitude: 0.7334 }, population: 15898 },
  { geoCode: '37208', postalCode: '37550', city: 'Saint-Avertin', center: { latitude: 47.3545, longitude: 0.7338 }, population: 14999 },
  { geoCode: '37050', postalCode: '37170', city: 'Chambray-lès-Tours', center: { latitude: 47.3329, longitude: 0.7205 }, population: 12720 },
  { geoCode: '37109', postalCode: '37230', city: 'Fondettes', center: { latitude: 47.4127, longitude: 0.6032 }, population: 10954 },
  { geoCode: '37195', postalCode: '37520', city: 'La Riche', center: { latitude: 47.3815, longitude: 0.6371 }, population: 10487 },
  { geoCode: '37018', postalCode: '37510', city: 'Ballan-Miré', center: { latitude: 47.3393, longitude: 0.5997 }, population: 8477 },
  { geoCode: '37139', postalCode: '37230', city: 'Luynes', center: { latitude: 47.4123, longitude: 0.5364 }, population: 5062 },
  { geoCode: '37172', postalCode: '37390', city: 'Notre-Dame-d\'Oé', center: { latitude: 47.4546, longitude: 0.7098 }, population: 4515 },
  { geoCode: '37054', postalCode: '37390', city: 'Chanceaux-sur-Choisille', center: { latitude: 47.4758, longitude: 0.705 }, population: 3499 },
  { geoCode: '37243', postalCode: '37510', city: 'Savonnières', center: { latitude: 47.3452, longitude: 0.5574 }, population: 3392 },
  { geoCode: '37151', postalCode: '37390', city: 'La Membrolle-sur-Choisille', center: { latitude: 47.4452, longitude: 0.6268 }, population: 3290 },
  { geoCode: '37203', postalCode: '37210', city: 'Rochecorbon', center: { latitude: 47.4338, longitude: 0.7605 }, population: 3219 },
  { geoCode: '37179', postalCode: '37210', city: 'Parçay-Meslay', center: { latitude: 47.4547, longitude: 0.7394 }, population: 2574 },
  { geoCode: '37152', postalCode: '37390', city: 'Mettray', center: { latitude: 47.4587, longitude: 0.6565 }, population: 2070 },
  { geoCode: '37217', postalCode: '37230', city: 'Saint-Étienne-de-Chigny', center: { latitude: 47.3933, longitude: 0.5002 }, population: 1579 },
  { geoCode: '37272', postalCode: '37510', city: 'Villandry', center: { latitude: 47.3321, longitude: 0.4898 }, population: 1143 },
  { geoCode: '37099', postalCode: '37190', city: 'Druye', center: { latitude: 47.2976, longitude: 0.5354 }, population: 1024 },
  { geoCode: '37219', postalCode: '37510', city: 'Saint-Genouph', center: { latitude: 47.3733, longitude: 0.5866 }, population: 1019 },
  { geoCode: '37025', postalCode: '37510', city: 'Berthenay', center: { latitude: 47.3591, longitude: 0.5231 }, population: 707 },
];

// Generic but plausible street names found in most French communes. Combined
// with the real commune name + postal code + coordinates, this gives realistic
// fake addresses without needing a per-commune street database.
const STREETS = [
  'Rue de l’Église',
  'Rue des Écoles',
  'Place de la Mairie',
  'Grande Rue',
  'Rue Nationale',
  'Rue de la République',
  'Rue Jean Jaurès',
  'Rue Victor Hugo',
  'Rue du 8 Mai 1945',
  'Rue de la Gare',
  'Rue du Stade',
  'Rue des Tilleuls',
  'Rue des Acacias',
  'Allée des Chênes',
  'Impasse des Lilas',
  'Rue de la Loire',
  'Rue du Maine',
  'Rue des Vignes',
  'Chemin des Prés',
  'Rue du Moulin'
];

export interface DemoSeed {
  currentUser: UserDTO;
  establishment: EstablishmentDTO;
}

let cache: DemoSeed | null = null;

/**
 * Populate the in-memory MSW store (`data`) with a coherent and reproducible
 * data set covering the whole Tours Métropole Val de Loire EPCI. Safe to call
 * multiple times — only seeds once.
 */
export function seed(): DemoSeed {
  if (cache) {
    return cache;
  }

  // Deterministic data: same content on every reload / deploy.
  faker.seed(20260608);
  faker.setDefaultRefDate('2026-01-01T00:00:00.000Z');

  // --- Establishment -------------------------------------------------------
  const establishment: EstablishmentDTO = {
    ...genEstablishmentDTO(),
    name: 'Test Tours Métropole Val de Loire',
    shortName: 'TMVL',
    siren: '243700754',
    geoCodes: EPCI_COMMUNES.map((commune) => commune.geoCode),
    available: true
  };
  data.establishments.push(establishment);

  // --- Users ---------------------------------------------------------------
  const currentUser: UserDTO = {
    ...genUserDTO(UserRole.USUAL, { id: establishment.id }),
    email: DEMO_EMAIL,
    firstName: 'Démonstrat',
    lastName: 'ZLV'
  };
  const colleagues = Array.from({ length: 3 }, () =>
    genUserDTO(UserRole.USUAL, { id: establishment.id })
  );
  // currentUser pushed first so it is the default fallback for the auth handler.
  data.users.push(currentUser, ...colleagues);

  // --- Owners --------------------------------------------------------------
  const owners: OwnerDTO[] = Array.from({ length: 180 }, () => genOwnerDTO());
  data.owners.push(...owners);

  // Pick a commune weighted by population, so the distribution looks realistic
  // (Tours gets the lion's share, the small communes only a few housings).
  const communeChoices = EPCI_COMMUNES.map((commune) => ({
    weight: commune.population,
    value: commune
  }));

  // --- Housings (+ owners with ranks per housing) --------------------------
  const housings: HousingDTO[] = [];
  for (let index = 0; index < HOUSING_COUNT; index++) {
    const commune = faker.helpers.weightedArrayElement(communeChoices);
    const base = genHousingDTO(commune.geoCode);
    const street = faker.helpers.arrayElement(STREETS);
    const houseNumber = faker.number.int({ min: 1, max: 120 });

    // Occupancy strictly tied to the data source: LOVAC housings are "Vacant",
    // fichiers fonciers housings are "En location".
    const occupancy = faker.helpers.weightedArrayElement([
      { weight: 75, value: Occupancy.VACANT },
      { weight: 25, value: Occupancy.RENT }
    ]);
    const isVacant = occupancy === Occupancy.VACANT;
    // Rented housings come from the fichiers fonciers ("locatif" variant, which
    // is what the "Fichiers fonciers … (en location)" source filter matches),
    // split between 2023 and 2024 so both millésimes are represented.
    const rentFileYear: 'ff-2023-locatif' | 'ff-2024-locatif' =
      faker.helpers.weightedArrayElement([
        { weight: 65, value: 'ff-2023-locatif' as const },
        { weight: 35, value: 'ff-2024-locatif' as const }
      ]);
    const rentDataYear = rentFileYear === 'ff-2024-locatif' ? 2024 : 2023;

    const housing: HousingDTO = {
      ...base,
      rawAddress: [
        `${houseNumber} ${street}`,
        `${commune.postalCode} ${commune.city}`
      ],
      // Real coordinates around the commune centre so the map shows the right
      // place for every housing.
      latitude:
        commune.center.latitude +
        faker.number.float({ min: -0.006, max: 0.006, fractionDigits: 5 }),
      longitude:
        commune.center.longitude +
        faker.number.float({ min: -0.009, max: 0.009, fractionDigits: 5 }),
      occupancy,
      occupancyIntended: null,
      // Every housing starts as "Non suivi" (no sub-status).
      status: HousingStatus.NEVER_CONTACTED,
      subStatus: null,
      // LOVAC 2026 for vacant housings (so they match the default
      // "LOVAC 2026" filter), fichiers fonciers 2023/2024 for rented ones.
      dataFileYears: isVacant ? ['lovac-2026'] : [rentFileYear],
      dataYears: isVacant ? [2026] : [rentDataYear],
      source: isVacant ? 'lovac' : 'datafoncier-import'
    };
    housings.push(housing);

    // 1 primary owner (rank 1) + up to 3 secondary owners (ranks 2..4), so the
    // review flow has meaningful rank-editing to test.
    const ownerCount = faker.number.int({ min: 1, max: 4 });
    const selectedOwners = faker.helpers.arrayElements(owners, ownerCount);
    data.housingOwners.set(
      housing.id,
      selectedOwners.map((owner, rankIndex) => ({
        id: owner.id,
        rank: rankIndex + 1,
        locprop: null,
        idprocpte: null,
        idprodroit: null,
        propertyRight: null,
        relativeLocation: 'same-commune',
        absoluteDistance: 50
      }))
    );
  }
  data.housings.push(...housings);

  // --- Localities (commune filter) -----------------------------------------
  // Register a locality only for communes that actually have housings, so the
  // commune filter lists exactly the communes present in the data.
  const usedGeoCodes = new Set(housings.map((housing) => housing.geoCode));
  EPCI_COMMUNES.filter((commune) => usedGeoCodes.has(commune.geoCode)).forEach(
    (commune) => {
      data.localities.set(commune.geoCode, {
        geoCode: commune.geoCode,
        name: commune.city,
        kind: null,
        taxKind: 'None'
      });
    }
  );

  // --- Groups --------------------------------------------------------------
  const groupHousingsA = housings.slice(0, 12);
  const groupHousingsB = housings.slice(12, 20);
  const groupA: GroupDTO = {
    ...genGroupDTO(currentUser, groupHousingsA),
    title: 'OPAH-RU',
    description:
      'Opération programmée d’amélioration de l’habitat – renouvellement urbain'
  };
  const groupB: GroupDTO = {
    ...genGroupDTO(currentUser, groupHousingsB),
    title: 'Centre-bourg',
    description: 'Logements vacants du centre-bourg'
  };
  data.groups.push(groupA, groupB);
  data.groupHousings.set(
    groupA.id,
    groupHousingsA.map((housing) => ({ id: housing.id }))
  );
  data.groupHousings.set(
    groupB.id,
    groupHousingsB.map((housing) => ({ id: housing.id }))
  );

  // --- Campaign (linked to group A) ----------------------------------------
  const campaignHousings = groupHousingsA;
  const campaign: CampaignDTO = genCampaignDTONext({
    group: groupA,
    author: currentUser,
    housings: campaignHousings,
    sentAt: null
  });
  data.campaigns.push(campaign);
  data.campaignHousings.set(
    campaign.id,
    campaignHousings.map((housing) => ({ id: housing.id }))
  );
  campaignHousings.forEach((housing) => {
    const existing = data.housingCampaigns.get(housing.id) ?? [];
    data.housingCampaigns.set(housing.id, [...existing, { id: campaign.id }]);
  });

  // --- Notes (on a few housings) -------------------------------------------
  housings.slice(0, 5).forEach((housing) => {
    const note = genNoteDTO(currentUser);
    data.notes.push(note);
    data.housingNotes.set(housing.id, [note.id]);
  });

  cache = { currentUser, establishment };
  return cache;
}

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
 * (weighted by population, so Vire Normandie concentrates most of them).
 */
const HOUSING_COUNT = 300;

// Communes de la CC Intercom de la Vire au Noireau (SIREN 200068799) — source geo.api.gouv.fr.
// geoCode INSEE, code postal principal et coordonnées du centre (réels) pour la carte.
const EPCI_COMMUNES: ReadonlyArray<{
  geoCode: string;
  postalCode: string;
  city: string;
  center: { latitude: number; longitude: number };
  population: number;
}> = [
  { geoCode: '14762', postalCode: '14500', city: 'Vire Normandie', center: { latitude: 48.8199, longitude: -0.8700 }, population: 17457 },
  { geoCode: '14061', postalCode: '14260', city: 'Souleuvre en Bocage', center: { latitude: 48.9616, longitude: -0.8400 }, population: 8629 },
  { geoCode: '14174', postalCode: '14110', city: 'Condé-en-Normandie', center: { latitude: 48.8852, longitude: -0.5779 }, population: 5985 },
  { geoCode: '14726', postalCode: '14350', city: 'Valdallière', center: { latitude: 48.8619, longitude: -0.7173 }, population: 5696 },
  { geoCode: '14658', postalCode: '14380', city: 'Noues de Sienne', center: { latitude: 48.8297, longitude: -1.0280 }, population: 4207 },
  { geoCode: '14357', postalCode: '14770', city: 'Terres de Druance', center: { latitude: 48.9278, longitude: -0.6531 }, population: 906 },
  { geoCode: '14352', postalCode: '14380', city: 'Landelles-et-Coupigny', center: { latitude: 48.8968, longitude: -1.0013 }, population: 818 },
  { geoCode: '14572', postalCode: '14110', city: 'Saint-Denis-de-Méré', center: { latitude: 48.8626, longitude: -0.5028 }, population: 754 },
  { geoCode: '14127', postalCode: '14500', city: 'Campagnolles', center: { latitude: 48.8893, longitude: -0.9370 }, population: 562 },
  { geoCode: '14559', postalCode: '14380', city: 'Saint-Aubin-des-Bois', center: { latitude: 48.8336, longitude: -1.1339 }, population: 226 },
  { geoCode: '14756', postalCode: '14570', city: 'La Villette', center: { latitude: 48.9089, longitude: -0.5428 }, population: 217 },
  { geoCode: '14054', postalCode: '14380', city: 'Beaumesnil', center: { latitude: 48.8971, longitude: -0.9676 }, population: 207 },
  { geoCode: '14424', postalCode: '14380', city: 'Le Mesnil-Robert', center: { latitude: 48.8801, longitude: -0.9731 }, population: 181 },
  { geoCode: '14619', postalCode: '14380', city: 'Sainte-Marie-Outre-l’Eau', center: { latitude: 48.9302, longitude: -1.0287 }, population: 124 },
  { geoCode: '14512', postalCode: '14110', city: 'Pontécoulant', center: { latitude: 48.8877, longitude: -0.5832 }, population: 71 },
  { geoCode: '14511', postalCode: '14380', city: 'Pont-Bellanger', center: { latitude: 48.9361, longitude: -0.9833 }, population: 60 },
  { geoCode: '14496', postalCode: '14770', city: 'Périgny', center: { latitude: 48.9180, longitude: -0.6054 }, population: 58 },
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
 * data set covering the whole Vire au Noireau EPCI. Safe to call
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
    name: 'Test Vire au Noireau',
    shortName: 'Vire au Noireau',
    siren: '200068799',
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
  // (Vire Normandie gets the lion's share, the small communes only a few housings).
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

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
 * (weighted by population, so Draguignan concentrates most of them).
 */
const HOUSING_COUNT = 300;

// Communes de la CA Dracénie Provence Verdon Agglomération (SIREN 248300493) — source geo.api.gouv.fr.
// geoCode INSEE, code postal principal et coordonnées du centre (réels) pour la carte.
const EPCI_COMMUNES: ReadonlyArray<{
  geoCode: string;
  postalCode: string;
  city: string;
  center: { latitude: number; longitude: number };
  population: number;
}> = [
  { geoCode: '83050', postalCode: '83300', city: 'Draguignan', center: { latitude: 43.5346, longitude: 6.4651 }, population: 40826 },
  { geoCode: '83148', postalCode: '83550', city: 'Vidauban', center: { latitude: 43.4071, longitude: 6.4599 }, population: 12608 },
  { geoCode: '83086', postalCode: '83490', city: 'Le Muy', center: { latitude: 43.4680, longitude: 6.5844 }, population: 10118 },
  { geoCode: '83072', postalCode: '83510', city: 'Lorgues', center: { latitude: 43.4734, longitude: 6.3588 }, population: 9849 },
  { geoCode: '83004', postalCode: '83460', city: 'Les Arcs', center: { latitude: 43.4533, longitude: 6.4862 }, population: 8109 },
  { geoCode: '83141', postalCode: '83720', city: 'Trans-en-Provence', center: { latitude: 43.5025, longitude: 6.4869 }, population: 6905 },
  { geoCode: '83058', postalCode: '83780', city: 'Flayosc', center: { latitude: 43.5441, longitude: 6.3577 }, population: 4673 },
  { geoCode: '83121', postalCode: '83690', city: 'Salernes', center: { latitude: 43.5646, longitude: 6.2379 }, population: 4019 },
  { geoCode: '83085', postalCode: '83920', city: 'La Motte', center: { latitude: 43.5091, longitude: 6.5506 }, population: 3071 },
  { geoCode: '83056', postalCode: '83830', city: 'Figanières', center: { latitude: 43.5642, longitude: 6.4915 }, population: 2762 },
  { geoCode: '83028', postalCode: '83830', city: 'Callas', center: { latitude: 43.5687, longitude: 6.5735 }, population: 2124 },
  { geoCode: '83134', postalCode: '83460', city: 'Taradeau', center: { latitude: 43.4657, longitude: 6.4283 }, population: 1945 },
  { geoCode: '83082', postalCode: '83131', city: 'Montferrat', center: { latitude: 43.6336, longitude: 6.4774 }, population: 1719 },
  { geoCode: '83011', postalCode: '83830', city: 'Bargemon', center: { latitude: 43.6344, longitude: 6.5439 }, population: 1433 },
  { geoCode: '83003', postalCode: '83111', city: 'Ampus', center: { latitude: 43.6218, longitude: 6.3683 }, population: 919 },
  { geoCode: '83154', postalCode: '83510', city: 'Saint-Antonin-du-Var', center: { latitude: 43.5071, longitude: 6.2935 }, population: 870 },
  { geoCode: '83128', postalCode: '83690', city: 'Sillans-la-Cascade', center: { latitude: 43.5650, longitude: 6.1549 }, population: 787 },
  { geoCode: '83041', postalCode: '83830', city: 'Claviers', center: { latitude: 43.5998, longitude: 6.5845 }, population: 727 },
  { geoCode: '83038', postalCode: '83300', city: 'Châteaudouble', center: { latitude: 43.6259, longitude: 6.4420 }, population: 476 },
  { geoCode: '83044', postalCode: '83840', city: 'Comps-sur-Artuby', center: { latitude: 43.7075, longitude: 6.5060 }, population: 339 },
  { geoCode: '83109', postalCode: '83840', city: 'La Roque-Esclapon', center: { latitude: 43.7210, longitude: 6.6479 }, population: 261 },
  { geoCode: '83013', postalCode: '83840', city: 'La Bastide', center: { latitude: 43.7464, longitude: 6.6327 }, population: 227 },
  { geoCode: '83010', postalCode: '83840', city: 'Bargème', center: { latitude: 43.7279, longitude: 6.5697 }, population: 207 },
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
 * data set covering the whole Dracénie Provence Verdon EPCI. Safe to call
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
    name: 'Test Dracénie Provence Verdon Agglomération',
    shortName: 'DPVa',
    siren: '248300493',
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
  // (Draguignan gets the lion's share, the small communes only a few housings).
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

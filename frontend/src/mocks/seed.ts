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
 * (weighted by population, so Poitiers concentrates most of them).
 */
const HOUSING_COUNT = 300;

// Communes de la CU du Grand Poitiers (SIREN 200069854) — source geo.api.gouv.fr.
// geoCode INSEE, code postal principal et coordonnées du centre (réels) pour la carte.
const EPCI_COMMUNES: ReadonlyArray<{
  geoCode: string;
  postalCode: string;
  city: string;
  center: { latitude: number; longitude: number };
  population: number;
}> = [
  { geoCode: '86194', postalCode: '86000', city: 'Poitiers', center: { latitude: 46.5846, longitude: 0.3715 }, population: 89916 },
  { geoCode: '86041', postalCode: '86180', city: 'Buxerolles', center: { latitude: 46.6057, longitude: 0.367 }, population: 10289 },
  { geoCode: '86115', postalCode: '86130', city: 'Jaunay-Marigny', center: { latitude: 46.7274, longitude: 0.3642 }, population: 7528 },
  { geoCode: '86214', postalCode: '86280', city: 'Saint-Benoît', center: { latitude: 46.5484, longitude: 0.3561 }, population: 7375 },
  { geoCode: '86070', postalCode: '86300', city: 'Chauvigny', center: { latitude: 46.5528, longitude: 0.6714 }, population: 7007 },
  { geoCode: '86297', postalCode: '86580', city: 'Vouneuil-sous-Biard', center: { latitude: 46.5843, longitude: 0.2694 }, population: 6290 },
  { geoCode: '86158', postalCode: '86440', city: 'Migné-Auxances', center: { latitude: 46.6307, longitude: 0.3008 }, population: 6285 },
  { geoCode: '86157', postalCode: '86550', city: 'Mignaloux-Beauvoir', center: { latitude: 46.5488, longitude: 0.4112 }, population: 5229 },
  { geoCode: '86062', postalCode: '86360', city: 'Chasseneuil-du-Poitou', center: { latitude: 46.6476, longitude: 0.356 }, population: 4743 },
  { geoCode: '86222', postalCode: '86130', city: 'Saint-Georges-lès-Baillargeaux', center: { latitude: 46.6681, longitude: 0.4428 }, population: 4385 },
  { geoCode: '86100', postalCode: '86240', city: 'Fontaine-le-Comte', center: { latitude: 46.5265, longitude: 0.2522 }, population: 3972 },
  { geoCode: '86163', postalCode: '86360', city: 'Montamisé', center: { latitude: 46.6255, longitude: 0.4381 }, population: 3723 },
  { geoCode: '86133', postalCode: '86240', city: 'Ligugé', center: { latitude: 46.5228, longitude: 0.29 }, population: 3444 },
  { geoCode: '86095', postalCode: '86130', city: 'Dissay', center: { latitude: 46.698, longitude: 0.4452 }, population: 3101 },
  { geoCode: '86019', postalCode: '86130', city: 'Beaumont Saint-Cyr', center: { latitude: 46.7256, longitude: 0.4556 }, population: 2908 },
  { geoCode: '86226', postalCode: '86800', city: 'Saint-Julien-l\'Ars', center: { latitude: 46.5546, longitude: 0.4931 }, population: 2880 },
  { geoCode: '86139', postalCode: '86600', city: 'Lusignan', center: { latitude: 46.4404, longitude: 0.1186 }, population: 2544 },
  { geoCode: '86213', postalCode: '86480', city: 'Rouillé', center: { latitude: 46.422, longitude: 0.0282 }, population: 2533 },
  { geoCode: '86261', postalCode: '86800', city: 'Sèvres-Anxaumont', center: { latitude: 46.5745, longitude: 0.4607 }, population: 2394 },
  { geoCode: '86027', postalCode: '86580', city: 'Biard', center: { latitude: 46.5861, longitude: 0.2952 }, population: 1910 },
  { geoCode: '86031', postalCode: '86300', city: 'Bonnes', center: { latitude: 46.6121, longitude: 0.6021 }, population: 1688 },
  { geoCode: '86024', postalCode: '86190', city: 'Béruges', center: { latitude: 46.5497, longitude: 0.2081 }, population: 1528 },
  { geoCode: '86045', postalCode: '86600', city: 'Celle-Lévescault', center: { latitude: 46.4065, longitude: 0.1744 }, population: 1383 },
  { geoCode: '86244', postalCode: '86600', city: 'Saint-Sauvant', center: { latitude: 46.3527, longitude: 0.0774 }, population: 1293 },
  { geoCode: '86114', postalCode: '86800', city: 'Jardres', center: { latitude: 46.5657, longitude: 0.5771 }, population: 1250 },
  { geoCode: '86256', postalCode: '86800', city: 'Savigny-Lévescault', center: { latitude: 46.5266, longitude: 0.4759 }, population: 1240 },
  { geoCode: '86124', postalCode: '86800', city: 'Lavoux', center: { latitude: 46.5961, longitude: 0.5288 }, population: 1192 },
  { geoCode: '86083', postalCode: '86600', city: 'Coulombiers', center: { latitude: 46.489, longitude: 0.174 }, population: 1155 },
  { geoCode: '86268', postalCode: '86800', city: 'Tercé', center: { latitude: 46.5136, longitude: 0.5582 }, population: 1135 },
  { geoCode: '86028', postalCode: '86800', city: 'Bignoux', center: { latitude: 46.6044, longitude: 0.4597 }, population: 1087 },
  { geoCode: '86088', postalCode: '86240', city: 'Croutelle', center: { latitude: 46.5415, longitude: 0.2944 }, population: 946 },
  { geoCode: '86116', postalCode: '86600', city: 'Jazeneuil', center: { latitude: 46.4749, longitude: 0.0735 }, population: 793 },
  { geoCode: '86198', postalCode: '86800', city: 'Pouillé', center: { latitude: 46.5419, longitude: 0.5795 }, population: 735 },
  { geoCode: '86058', postalCode: '86210', city: 'La Chapelle-Moulière', center: { latitude: 46.6438, longitude: 0.5401 }, population: 723 },
  { geoCode: '86202', postalCode: '86260', city: 'La Puye', center: { latitude: 46.6468, longitude: 0.7444 }, population: 608 },
  { geoCode: '86135', postalCode: '86800', city: 'Liniers', center: { latitude: 46.6193, longitude: 0.5292 }, population: 591 },
  { geoCode: '86253', postalCode: '86600', city: 'Sanxay', center: { latitude: 46.4963, longitude: -0.0057 }, population: 548 },
  { geoCode: '86080', postalCode: '86600', city: 'Cloué', center: { latitude: 46.4464, longitude: 0.1666 }, population: 490 },
  { geoCode: '86091', postalCode: '86600', city: 'Curzay-sur-Vonne', center: { latitude: 46.4902, longitude: 0.0428 }, population: 380 },
  { geoCode: '86239', postalCode: '86300', city: 'Sainte-Radégonde', center: { latitude: 46.6176, longitude: 0.7041 }, population: 187 },
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
 * data set covering the whole CU du Grand Poitiers EPCI. Safe to call
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
    name: 'Test CU du Grand Poitiers',
    shortName: 'Grand Poitiers',
    siren: '200069854',
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
  // (Poitiers gets the lion's share, the small communes only a few housings).
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

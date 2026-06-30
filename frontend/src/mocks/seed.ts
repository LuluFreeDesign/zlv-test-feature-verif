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
 * (weighted by population, so Douai concentrates most of them).
 */
const HOUSING_COUNT = 300;

// Communes de la CA Douaisis Agglo (SIREN 200044618) — source geo.api.gouv.fr.
// geoCode INSEE, code postal principal et coordonnées du centre (réels) pour la carte.
const EPCI_COMMUNES: ReadonlyArray<{
  geoCode: string;
  postalCode: string;
  city: string;
  center: { latitude: number; longitude: number };
  population: number;
}> = [
  { geoCode: '59178', postalCode: '59500', city: 'Douai', center: { latitude: 50.3785, longitude: 3.1004 }, population: 40250 },
  { geoCode: '59569', postalCode: '59450', city: 'Sin-le-Noble', center: { latitude: 50.3672, longitude: 3.1213 }, population: 16076 },
  { geoCode: '59654', postalCode: '59119', city: 'Waziers', center: { latitude: 50.3841, longitude: 3.1121 }, population: 7266 },
  { geoCode: '59028', postalCode: '59950', city: 'Auby', center: { latitude: 50.4143, longitude: 3.0612 }, population: 7083 },
  { geoCode: '59165', postalCode: '59553', city: 'Cuincy', center: { latitude: 50.3746, longitude: 3.0313 }, population: 6467 },
  { geoCode: '59327', postalCode: '59167', city: 'Lallaing', center: { latitude: 50.3868, longitude: 3.1719 }, population: 6287 },
  { geoCode: '59509', postalCode: '59286', city: 'Roost-Warendin', center: { latitude: 50.4127, longitude: 3.0981 }, population: 5956 },
  { geoCode: '59239', postalCode: '59148', city: 'Flines-lez-Raches', center: { latitude: 50.4158, longitude: 3.1833 }, population: 5745 },
  { geoCode: '59234', postalCode: '59128', city: 'Flers-en-Escrebieux', center: { latitude: 50.4025, longitude: 3.0497 }, population: 5424 },
  { geoCode: '59170', postalCode: '59187', city: 'Dechy', center: { latitude: 50.3523, longitude: 3.1288 }, population: 5338 },
  { geoCode: '59329', postalCode: '59552', city: 'Lambres-lez-Douai', center: { latitude: 50.3548, longitude: 3.0542 }, population: 4883 },
  { geoCode: '59276', postalCode: '59287', city: 'Guesnain', center: { latitude: 50.3486, longitude: 3.1480 }, population: 4635 },
  { geoCode: '59489', postalCode: '59283', city: 'Raimbeaucourt', center: { latitude: 50.4369, longitude: 3.1024 }, population: 4000 },
  { geoCode: '59015', postalCode: '59151', city: 'Arleux', center: { latitude: 50.2834, longitude: 3.1041 }, population: 3125 },
  { geoCode: '59156', postalCode: '59552', city: 'Courchelettes', center: { latitude: 50.3420, longitude: 3.0595 }, population: 2855 },
  { geoCode: '59486', postalCode: '59194', city: 'Râches', center: { latitude: 50.4208, longitude: 3.1338 }, population: 2672 },
  { geoCode: '59222', postalCode: '59310', city: 'Faumont', center: { latitude: 50.4503, longitude: 3.1335 }, population: 2278 },
  { geoCode: '59126', postalCode: '59169', city: 'Cantin', center: { latitude: 50.3084, longitude: 3.1258 }, population: 1741 },
  { geoCode: '59224', postalCode: '59247', city: 'Féchain', center: { latitude: 50.2692, longitude: 3.2134 }, population: 1635 },
  { geoCode: '59334', postalCode: '59553', city: 'Lauwin-Planque', center: { latitude: 50.3921, longitude: 3.0306 }, population: 1608 },
  { geoCode: '59228', postalCode: '59169', city: 'Férin', center: { latitude: 50.3300, longitude: 3.0827 }, population: 1432 },
  { geoCode: '59336', postalCode: '59259', city: 'Lécluse', center: { latitude: 50.2758, longitude: 3.0330 }, population: 1346 },
  { geoCode: '59026', postalCode: '59265', city: 'Aubigny-au-Bac', center: { latitude: 50.2665, longitude: 3.1664 }, population: 1143 },
  { geoCode: '59214', postalCode: '59151', city: 'Estrées', center: { latitude: 50.2986, longitude: 3.0721 }, population: 1134 },
  { geoCode: '59117', postalCode: '59151', city: 'Bugnicourt', center: { latitude: 50.2895, longitude: 3.1547 }, population: 1095 },
  { geoCode: '59263', postalCode: '59169', city: 'Gœulzin', center: { latitude: 50.3161, longitude: 3.1011 }, population: 1070 },
  { geoCode: '59254', postalCode: '59234', city: 'Fressain', center: { latitude: 50.2835, longitude: 3.1907 }, population: 919 },
  { geoCode: '59211', postalCode: '59553', city: 'Esquerchin', center: { latitude: 50.3873, longitude: 3.0059 }, population: 893 },
  { geoCode: '59007', postalCode: '59194', city: 'Anhiers', center: { latitude: 50.4037, longitude: 3.1546 }, population: 888 },
  { geoCode: '59280', postalCode: '59151', city: 'Hamel', center: { latitude: 50.2828, longitude: 3.0692 }, population: 797 },
  { geoCode: '59379', postalCode: '59252', city: 'Marcq-en-Ostrevent', center: { latitude: 50.2889, longitude: 3.2334 }, population: 741 },
  { geoCode: '59115', postalCode: '59151', city: 'Brunémont', center: { latitude: 50.2740, longitude: 3.1436 }, population: 704 },
  { geoCode: '59199', postalCode: '59169', city: 'Erchin', center: { latitude: 50.3142, longitude: 3.1710 }, population: 670 },
  { geoCode: '59620', postalCode: '59234', city: 'Villers-au-Tertre', center: { latitude: 50.3001, longitude: 3.1729 }, population: 670 },
  { geoCode: '59513', postalCode: '59169', city: 'Roucourt', center: { latitude: 50.3275, longitude: 3.1460 }, population: 456 },
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
 * data set covering the whole Douaisis Agglo EPCI. Safe to call
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
    name: 'Test Douaisis Agglo',
    shortName: 'Douaisis Agglo',
    siren: '200044618',
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
  // (Douai gets the lion's share, the small communes only a few housings).
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
      // "LOVAC 2026" filter), fichiers fonciers 2023 for rented ones.
      dataFileYears: isVacant ? ['lovac-2026'] : ['ff-2023'],
      dataYears: isVacant ? [2026] : [2023],
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

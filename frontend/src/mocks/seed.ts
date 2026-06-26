import { faker } from '@faker-js/faker/locale/fr';
import {
  type CampaignDTO,
  type DataFileYear,
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
 * (weighted by population, so Angers concentrates most of them).
 */
const HOUSING_COUNT = 300;

// Communes de l’EPCI Angers Loire Métropole (SIREN 244900015) — source geo.api.gouv.fr.
// geoCode INSEE, code postal principal et coordonnées du centre (réels) pour la carte.
const ALM_COMMUNES: ReadonlyArray<{
  geoCode: string;
  postalCode: string;
  city: string;
  center: { latitude: number; longitude: number };
  population: number;
}> = [
  { geoCode: '49007', postalCode: '49000', city: 'Angers', center: { latitude: 47.4819, longitude: -0.5629 }, population: 159022 },
  { geoCode: '49307', postalCode: '49140', city: 'Loire-Authion', center: { latitude: 47.4695, longitude: -0.3734 }, population: 16765 },
  { geoCode: '49353', postalCode: '49800', city: 'Trélazé', center: { latitude: 47.4522, longitude: -0.4780 }, population: 16333 },
  { geoCode: '49015', postalCode: '49240', city: 'Avrillé', center: { latitude: 47.5027, longitude: -0.6011 }, population: 15251 },
  { geoCode: '49246', postalCode: '49130', city: 'Les Ponts-de-Cé', center: { latitude: 47.4270, longitude: -0.5110 }, population: 13149 },
  { geoCode: '49267', postalCode: '49124', city: 'Saint-Barthélemy-d’Anjou', center: { latitude: 47.4741, longitude: -0.4826 }, population: 9720 },
  { geoCode: '49323', postalCode: '49112', city: 'Verrières-en-Anjou', center: { latitude: 47.5182, longitude: -0.4746 }, population: 8116 },
  { geoCode: '49214', postalCode: '49460', city: 'Montreuil-Juigné', center: { latitude: 47.5451, longitude: -0.6178 }, population: 7808 },
  { geoCode: '49035', postalCode: '49080', city: 'Bouchemaine', center: { latitude: 47.4288, longitude: -0.6241 }, population: 6580 },
  { geoCode: '49200', postalCode: '49220', city: 'Longuenée-en-Anjou', center: { latitude: 47.5523, longitude: -0.6797 }, population: 6571 },
  { geoCode: '49223', postalCode: '49610', city: 'Mûrs-Erigné', center: { latitude: 47.3948, longitude: -0.5529 }, population: 6408 },
  { geoCode: '49020', postalCode: '49070', city: 'Beaucouzé', center: { latitude: 47.4742, longitude: -0.6358 }, population: 5732 },
  { geoCode: '49377', postalCode: '49140', city: 'Rives-du-Loir-en-Anjou', center: { latitude: 47.5572, longitude: -0.4448 }, population: 5644 },
  { geoCode: '49129', postalCode: '49000', city: 'Écouflant', center: { latitude: 47.5240, longitude: -0.5190 }, population: 4749 },
  { geoCode: '49298', postalCode: '49070', city: 'Saint-Léger-de-Linières', center: { latitude: 47.4609, longitude: -0.7069 }, population: 3866 },
  { geoCode: '49278', postalCode: '49130', city: 'Sainte-Gemmes-sur-Loire', center: { latitude: 47.4296, longitude: -0.5702 }, population: 3685 },
  { geoCode: '49048', postalCode: '49125', city: 'Briollay', center: { latitude: 47.5758, longitude: -0.4954 }, population: 3225 },
  { geoCode: '49294', postalCode: '49070', city: 'Saint-Lambert-la-Potherie', center: { latitude: 47.4870, longitude: -0.6904 }, population: 2974 },
  { geoCode: '49241', postalCode: '49124', city: 'Le Plessis-Grammoire', center: { latitude: 47.4941, longitude: -0.4365 }, population: 2664 },
  { geoCode: '49055', postalCode: '49460', city: 'Cantenay-Épinard', center: { latitude: 47.5400, longitude: -0.5635 }, population: 2415 },
  { geoCode: '49135', postalCode: '49460', city: 'Feneu', center: { latitude: 47.5832, longitude: -0.6038 }, population: 2212 },
  { geoCode: '49271', postalCode: '49370', city: 'Saint-Clément-de-la-Place', center: { latitude: 47.5264, longitude: -0.7328 }, population: 2168 },
  { geoCode: '49306', postalCode: '49170', city: 'Saint-Martin-du-Fouilloux', center: { latitude: 47.4355, longitude: -0.7115 }, population: 1705 },
  { geoCode: '49339', postalCode: '49460', city: 'Soulaire-et-Bourg', center: { latitude: 47.5761, longitude: -0.5402 }, population: 1467 },
  { geoCode: '49329', postalCode: '49170', city: 'Savennières', center: { latitude: 47.4064, longitude: -0.6640 }, population: 1349 },
  { geoCode: '49338', postalCode: '49610', city: 'Soulaines-sur-Aubance', center: { latitude: 47.3616, longitude: -0.5218 }, population: 1329 },
  { geoCode: '49326', postalCode: '49800', city: 'Sarrigné', center: { latitude: 47.5032, longitude: -0.3894 }, population: 935 },
  { geoCode: '49130', postalCode: '49460', city: 'Écuillé', center: { latitude: 47.6158, longitude: -0.5559 }, population: 655 },
  { geoCode: '49028', postalCode: '49170', city: 'Béhuard', center: { latitude: 47.3796, longitude: -0.6481 }, population: 115 }
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

const LOVAC_YEARS: DataFileYear[] = [
  'lovac-2026',
  'lovac-2025',
  'lovac-2024',
  'lovac-2023'
];

export interface DemoSeed {
  currentUser: UserDTO;
  establishment: EstablishmentDTO;
}

let cache: DemoSeed | null = null;

/**
 * Populate the in-memory MSW store (`data`) with a coherent and reproducible
 * data set covering the whole Angers Loire Métropole EPCI. Safe to call
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
    name: 'Test Angers Loire Métropole',
    shortName: 'ALM',
    siren: '244900015',
    geoCodes: ALM_COMMUNES.map((commune) => commune.geoCode),
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
  // (Angers gets the lion's share, the small communes only a few housings).
  const communeChoices = ALM_COMMUNES.map((commune) => ({
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

    // Occupancy mix so the "occupation actuelle" filter has several values to
    // test: mostly vacant (LOVAC), some rented and a few short-term rentals
    // (fichiers fonciers 2023).
    const occupancy = faker.helpers.weightedArrayElement([
      { weight: 72, value: Occupancy.VACANT },
      { weight: 22, value: Occupancy.RENT },
      { weight: 6, value: Occupancy.SHORT_RENT }
    ]);
    const isVacant = occupancy === Occupancy.VACANT;
    const lovacYear = faker.helpers.arrayElement(LOVAC_YEARS);

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
      dataFileYears: isVacant ? [lovacYear] : ['ff-2023'],
      dataYears: isVacant ? [Number(lovacYear.slice('lovac-'.length))] : [2023],
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

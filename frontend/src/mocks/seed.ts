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
 * (weighted by population, so Marseille concentrates most of them).
 */
const HOUSING_COUNT = 300;

// Communes de la Métropole d’Aix-Marseille-Provence (SIREN 200054807) — source geo.api.gouv.fr.
// geoCode INSEE, code postal principal et coordonnées du centre (réels) pour la carte.
const EPCI_COMMUNES: ReadonlyArray<{
  geoCode: string;
  postalCode: string;
  city: string;
  center: { latitude: number; longitude: number };
  population: number;
}> = [
  { geoCode: '13055', postalCode: '13001', city: 'Marseille', center: { latitude: 43.2803, longitude: 5.3806 }, population: 886040 },
  { geoCode: '13001', postalCode: '13080', city: 'Aix-en-Provence', center: { latitude: 43.5360, longitude: 5.3879 }, population: 149695 },
  { geoCode: '13056', postalCode: '13117', city: 'Martigues', center: { latitude: 43.3839, longitude: 5.0451 }, population: 48298 },
  { geoCode: '13005', postalCode: '13400', city: 'Aubagne', center: { latitude: 43.2904, longitude: 5.5643 }, population: 47529 },
  { geoCode: '13047', postalCode: '13118', city: 'Istres', center: { latitude: 43.5455, longitude: 4.9477 }, population: 44292 },
  { geoCode: '13103', postalCode: '13300', city: 'Salon-de-Provence', center: { latitude: 43.6430, longitude: 5.0490 }, population: 44194 },
  { geoCode: '13028', postalCode: '13600', city: 'La Ciotat', center: { latitude: 43.1882, longitude: 5.6175 }, population: 38477 },
  { geoCode: '13117', postalCode: '13127', city: 'Vitrolles', center: { latitude: 43.4509, longitude: 5.2656 }, population: 36758 },
  { geoCode: '13054', postalCode: '13700', city: 'Marignane', center: { latitude: 43.4218, longitude: 5.2178 }, population: 33692 },
  { geoCode: '13063', postalCode: '13140', city: 'Miramas', center: { latitude: 43.5841, longitude: 5.0148 }, population: 26203 },
  { geoCode: '13071', postalCode: '13170', city: 'Les Pennes-Mirabeau', center: { latitude: 43.4005, longitude: 5.3222 }, population: 22537 },
  { geoCode: '13041', postalCode: '13120', city: 'Gardanne', center: { latitude: 43.4585, longitude: 5.4857 }, population: 21597 },
  { geoCode: '13002', postalCode: '13190', city: 'Allauch', center: { latitude: 43.3522, longitude: 5.5103 }, population: 21443 },
  { geoCode: '84089', postalCode: '84120', city: 'Pertuis', center: { latitude: 43.6931, longitude: 5.5345 }, population: 19548 },
  { geoCode: '13026', postalCode: '13220', city: 'Châteauneuf-les-Martigues', center: { latitude: 43.3904, longitude: 5.1464 }, population: 18455 },
  { geoCode: '13039', postalCode: '13270', city: 'Fos-sur-Mer', center: { latitude: 43.4545, longitude: 4.8979 }, population: 15862 },
  { geoCode: '13077', postalCode: '13110', city: 'Port-de-Bouc', center: { latitude: 43.4207, longitude: 4.9993 }, population: 15802 },
  { geoCode: '13015', postalCode: '13320', city: 'Bouc-Bel-Air', center: { latitude: 43.4442, longitude: 5.4118 }, population: 15381 },
  { geoCode: '13014', postalCode: '13130', city: 'Berre-l’Étang', center: { latitude: 43.4976, longitude: 5.1596 }, population: 13832 },
  { geoCode: '13007', postalCode: '13390', city: 'Auriol', center: { latitude: 43.3594, longitude: 5.6559 }, population: 13037 },
  { geoCode: '13081', postalCode: '13340', city: 'Rognac', center: { latitude: 43.4995, longitude: 5.2330 }, population: 12576 },
  { geoCode: '13106', postalCode: '13240', city: 'Septèmes-les-Vallons', center: { latitude: 43.3931, longitude: 5.3828 }, population: 11995 },
  { geoCode: '13075', postalCode: '13380', city: 'Plan-de-Cuques', center: { latitude: 43.3642, longitude: 5.4639 }, population: 11632 },
  { geoCode: '13069', postalCode: '13330', city: 'Pélissanne', center: { latitude: 43.6300, longitude: 5.1628 }, population: 11085 },
  { geoCode: '13110', postalCode: '13530', city: 'Trets', center: { latitude: 43.4452, longitude: 5.7137 }, population: 10946 },
  { geoCode: '13043', postalCode: '13180', city: 'Gignac-la-Nerthe', center: { latitude: 43.3873, longitude: 5.2334 }, population: 10343 },
  { geoCode: '13040', postalCode: '13710', city: 'Fuveau', center: { latitude: 43.4575, longitude: 5.5537 }, population: 10337 },
  { geoCode: '13019', postalCode: '13480', city: 'Cabriès', center: { latitude: 43.4530, longitude: 5.3467 }, population: 10240 },
  { geoCode: '13050', postalCode: '13410', city: 'Lambesc', center: { latitude: 43.6636, longitude: 5.2493 }, population: 10024 },
  { geoCode: '13051', postalCode: '13680', city: 'Lançon-Provence', center: { latitude: 43.5728, longitude: 5.1725 }, population: 9915 },
  { geoCode: '13037', postalCode: '13580', city: 'La Fare-les-Oliviers', center: { latitude: 43.5541, longitude: 5.2051 }, population: 9039 },
  { geoCode: '13112', postalCode: '13880', city: 'Velaux', center: { latitude: 43.5215, longitude: 5.2460 }, population: 8941 },
  { geoCode: '13086', postalCode: '13360', city: 'Roquevaire', center: { latitude: 43.3452, longitude: 5.5980 }, population: 8915 },
  { geoCode: '13092', postalCode: '13250', city: 'Saint-Chamas', center: { latitude: 43.5414, longitude: 5.0720 }, population: 8676 },
  { geoCode: '13078', postalCode: '13230', city: 'Port-Saint-Louis-du-Rhône', center: { latitude: 43.4066, longitude: 4.8260 }, population: 8573 },
  { geoCode: '13032', postalCode: '13510', city: 'Éguilles', center: { latitude: 43.5662, longitude: 5.3177 }, population: 8479 },
  { geoCode: '13113', postalCode: '13770', city: 'Venelles', center: { latitude: 43.5951, longitude: 5.4991 }, population: 8418 },
  { geoCode: '13104', postalCode: '13960', city: 'Sausset-les-Pins', center: { latitude: 43.3469, longitude: 5.1158 }, population: 7574 },
  { geoCode: '13035', postalCode: '13430', city: 'Eyguières', center: { latitude: 43.7005, longitude: 5.0132 }, population: 7119 },
  { geoCode: '13105', postalCode: '13560', city: 'Sénas', center: { latitude: 43.7402, longitude: 5.0730 }, population: 6925 },
  { geoCode: '13119', postalCode: '13470', city: 'Carnoux-en-Provence', center: { latitude: 43.2590, longitude: 5.5655 }, population: 6873 },
  { geoCode: '13060', postalCode: '13590', city: 'Meyreuil', center: { latitude: 43.4880, longitude: 5.5002 }, population: 6747 },
  { geoCode: '13102', postalCode: '13730', city: 'Saint-Victoret', center: { latitude: 43.4121, longitude: 5.2508 }, population: 6730 },
  { geoCode: '13022', postalCode: '13260', city: 'Cassis', center: { latitude: 43.2185, longitude: 5.5503 }, population: 6661 },
  { geoCode: '13070', postalCode: '13821', city: 'La Penne-sur-Huveaune', center: { latitude: 43.2778, longitude: 5.5185 }, population: 6605 },
  { geoCode: '13042', postalCode: '13420', city: 'Gémenos', center: { latitude: 43.2969, longitude: 5.6518 }, population: 6579 },
  { geoCode: '13016', postalCode: '13720', city: 'La Bouilladisse', center: { latitude: 43.3942, longitude: 5.6260 }, population: 6547 },
  { geoCode: '13030', postalCode: '13780', city: 'Cuges-les-Pins', center: { latitude: 43.2822, longitude: 5.7099 }, population: 6236 },
  { geoCode: '13098', postalCode: '13920', city: 'Saint-Mitre-les-Remparts', center: { latitude: 43.4565, longitude: 5.0152 }, population: 6175 },
  { geoCode: '13053', postalCode: '13370', city: 'Mallemort', center: { latitude: 43.7280, longitude: 5.1849 }, population: 6166 },
  { geoCode: '13091', postalCode: '13760', city: 'Saint-Cannat', center: { latitude: 43.6155, longitude: 5.3108 }, population: 6097 },
  { geoCode: '13080', postalCode: '13610', city: 'Le Puy-Sainte-Réparade', center: { latitude: 43.6533, longitude: 5.4401 }, population: 5935 },
  { geoCode: '83120', postalCode: '83640', city: 'Saint-Zacharie', center: { latitude: 43.3749, longitude: 5.7164 }, population: 5879 },
  { geoCode: '13114', postalCode: '13122', city: 'Ventabren', center: { latitude: 43.5446, longitude: 5.3045 }, population: 5839 },
  { geoCode: '13085', postalCode: '13830', city: 'Roquefort-la-Bédoule', center: { latitude: 43.2518, longitude: 5.6297 }, population: 5798 },
  { geoCode: '13107', postalCode: '13109', city: 'Simiane-Collongue', center: { latitude: 43.4154, longitude: 5.4359 }, population: 5780 },
  { geoCode: '13073', postalCode: '13124', city: 'Peypin', center: { latitude: 43.3834, longitude: 5.5700 }, population: 5771 },
  { geoCode: '13033', postalCode: '13820', city: 'Ensuès-la-Redonne', center: { latitude: 43.3554, longitude: 5.1880 }, population: 5757 },
  { geoCode: '13021', postalCode: '13620', city: 'Carry-le-Rouet', center: { latitude: 43.3462, longitude: 5.1587 }, population: 5702 },
  { geoCode: '13044', postalCode: '13450', city: 'Grans', center: { latitude: 43.6172, longitude: 5.0431 }, population: 5489 },
  { geoCode: '13084', postalCode: '13640', city: 'La Roque-d’Anthéron', center: { latitude: 43.7166, longitude: 5.3165 }, population: 5459 },
  { geoCode: '13087', postalCode: '13790', city: 'Rousset', center: { latitude: 43.4869, longitude: 5.6202 }, population: 5425 },
  { geoCode: '13074', postalCode: '13860', city: 'Peyrolles-en-Provence', center: { latitude: 43.6262, longitude: 5.5763 }, population: 5409 },
  { geoCode: '13088', postalCode: '13740', city: 'Le Rove', center: { latitude: 43.3622, longitude: 5.2498 }, population: 5246 },
  { geoCode: '13023', postalCode: '13600', city: 'Ceyreste', center: { latitude: 43.2215, longitude: 5.6354 }, population: 4863 },
  { geoCode: '13082', postalCode: '13840', city: 'Rognes', center: { latitude: 43.6672, longitude: 5.3546 }, population: 4693 },
  { geoCode: '13046', postalCode: '13850', city: 'Gréasque', center: { latitude: 43.4252, longitude: 5.5470 }, population: 4554 },
  { geoCode: '13048', postalCode: '13490', city: 'Jouques', center: { latitude: 43.6289, longitude: 5.6605 }, population: 4547 },
  { geoCode: '13062', postalCode: '13105', city: 'Mimet', center: { latitude: 43.4123, longitude: 5.5001 }, population: 4241 },
  { geoCode: '13031', postalCode: '13112', city: 'La Destrousse', center: { latitude: 43.3788, longitude: 5.5984 }, population: 4133 },
  { geoCode: '13059', postalCode: '13650', city: 'Meyrargues', center: { latitude: 43.6229, longitude: 5.5321 }, population: 3847 },
  { geoCode: '13118', postalCode: '13111', city: 'Coudoux', center: { latitude: 43.5587, longitude: 5.2559 }, population: 3825 },
  { geoCode: '13072', postalCode: '13790', city: 'Peynier', center: { latitude: 43.4375, longitude: 5.6204 }, population: 3739 },
  { geoCode: '13101', postalCode: '13119', city: 'Saint-Savournin', center: { latitude: 43.4025, longitude: 5.5321 }, population: 3397 },
  { geoCode: '13003', postalCode: '13980', city: 'Alleins', center: { latitude: 43.7098, longitude: 5.1558 }, population: 2852 },
  { geoCode: '13024', postalCode: '13350', city: 'Charleval', center: { latitude: 43.7205, longitude: 5.2461 }, population: 2640 },
  { geoCode: '13109', postalCode: '13100', city: 'Le Tholonet', center: { latitude: 43.5218, longitude: 5.5053 }, population: 2391 },
  { geoCode: '13025', postalCode: '13790', city: 'Châteauneuf-le-Rouge', center: { latitude: 43.4892, longitude: 5.5691 }, population: 2376 },
  { geoCode: '13020', postalCode: '13950', city: 'Cadolive', center: { latitude: 43.3943, longitude: 5.5303 }, population: 2236 },
  { geoCode: '13115', postalCode: '13116', city: 'Vernègues', center: { latitude: 43.6841, longitude: 5.1892 }, population: 2166 },
  { geoCode: '13049', postalCode: '13113', city: 'Lamanon', center: { latitude: 43.7073, longitude: 5.0898 }, population: 2097 },
  { geoCode: '13013', postalCode: '13720', city: 'Belcodène', center: { latitude: 43.4231, longitude: 5.5846 }, population: 2009 },
  { geoCode: '13079', postalCode: '13114', city: 'Puyloubier', center: { latitude: 43.5192, longitude: 5.6718 }, population: 1768 },
  { geoCode: '13029', postalCode: '13250', city: 'Cornillon-Confoux', center: { latitude: 43.5762, longitude: 5.0753 }, population: 1667 },
  { geoCode: '13095', postalCode: '13100', city: 'Saint-Marc-Jaumegarde', center: { latitude: 43.5567, longitude: 5.5202 }, population: 1273 },
  { geoCode: '13111', postalCode: '13126', city: 'Vauvenargues', center: { latitude: 43.5619, longitude: 5.6207 }, population: 1058 },
  { geoCode: '13099', postalCode: '13115', city: 'Saint-Paul-lès-Durance', center: { latitude: 43.6869, longitude: 5.7480 }, population: 885 },
  { geoCode: '13009', postalCode: '13330', city: 'La Barben', center: { latitude: 43.6189, longitude: 5.2123 }, population: 868 },
  { geoCode: '13012', postalCode: '13100', city: 'Beaurecueil', center: { latitude: 43.5197, longitude: 5.5481 }, population: 585 },
  { geoCode: '13008', postalCode: '13121', city: 'Aurons', center: { latitude: 43.6722, longitude: 5.1490 }, population: 555 },
  { geoCode: '13093', postalCode: '13610', city: 'Saint-Estève-Janson', center: { latitude: 43.6926, longitude: 5.3891 }, population: 357 },
  { geoCode: '13090', postalCode: '13100', city: 'Saint-Antonin-sur-Bayon', center: { latitude: 43.5191, longitude: 5.5972 }, population: 126 },
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
 * data set covering the whole Aix-Marseille-Provence metropolis. Safe to call
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
    name: 'Test Métropole Aix-Marseille-Provence',
    shortName: 'AMP',
    siren: '200054807',
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
  // (Marseille gets the lion's share, the small communes only a few housings).
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

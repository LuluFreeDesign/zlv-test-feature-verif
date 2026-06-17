import { faker } from '@faker-js/faker/locale/fr';
import {
  type CampaignDTO,
  type DataFileYear,
  type EstablishmentDTO,
  type GroupDTO,
  type HousingDTO,
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
 * Communes of Lorient Agglomération (INSEE geo code → label) so every housing
 * belongs to the same EPCI.
 */
const LORIENT_AGGLO_COMMUNES: Record<
  string,
  { name: string; postalCode: string }
> = {
  '56121': { name: 'Lorient', postalCode: '56100' },
  '56098': { name: 'Lanester', postalCode: '56600' },
  '56083': { name: 'Hennebont', postalCode: '56700' },
  '56162': { name: 'Ploemeur', postalCode: '56270' },
  '56185': { name: 'Quéven', postalCode: '56530' },
  '56036': { name: 'Caudan', postalCode: '56850' },
  '56107': { name: 'Larmor-Plage', postalCode: '56260' },
  '56078': { name: 'Guidel', postalCode: '56520' }
};
const LORIENT_GEO_CODES = Object.keys(LORIENT_AGGLO_COMMUNES);
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
 * Populate the in-memory MSW store (`data`) with a small, coherent and
 * reproducible data set. Safe to call multiple times — only seeds once.
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
    name: 'Lorient Agglomération',
    shortName: 'Lorient Agglo',
    siren: '200042174',
    geoCodes: LORIENT_GEO_CODES,
    available: true
  };
  data.establishments.push(establishment);

  // --- Users ---------------------------------------------------------------
  const currentUser: UserDTO = {
    ...genUserDTO(UserRole.USUAL, { id: establishment.id }),
    email: DEMO_EMAIL,
    firstName: 'Camille',
    lastName: 'Démonstration'
  };
  const colleagues = Array.from({ length: 3 }, () =>
    genUserDTO(UserRole.USUAL, { id: establishment.id })
  );
  // currentUser pushed first so it is the default fallback for the auth handler.
  data.users.push(currentUser, ...colleagues);

  // --- Owners --------------------------------------------------------------
  const owners: OwnerDTO[] = Array.from({ length: 25 }, () => genOwnerDTO());
  data.owners.push(...owners);

  // --- Housings (+ owners with ranks per housing) --------------------------
  const housings: HousingDTO[] = [];
  for (let index = 0; index < 32; index++) {
    const geoCode = LORIENT_GEO_CODES[index % LORIENT_GEO_CODES.length];
    const commune = LORIENT_AGGLO_COMMUNES[geoCode];
    const base = genHousingDTO(geoCode);

    // Most housings are vacant (LOVAC source); a minority are rented (fichiers
    // fonciers 2023) without an intended occupancy.
    const isRental = index % 5 === 0;
    const lovacYear = faker.helpers.arrayElement(LOVAC_YEARS);
    const housing: HousingDTO = {
      ...base,
      rawAddress: [base.rawAddress[0], `${commune.postalCode} ${commune.name}`],
      occupancy: isRental ? Occupancy.RENT : Occupancy.VACANT,
      occupancyIntended: null,
      dataFileYears: isRental ? ['ff-2023'] : [lovacYear],
      dataYears: isRental ? [2023] : [Number(lovacYear.slice('lovac-'.length))],
      source: isRental ? 'datafoncier-import' : 'lovac'
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
  const groupHousingsA = housings.slice(0, 8);
  const groupHousingsB = housings.slice(8, 14);
  const groupA: GroupDTO = genGroupDTO(currentUser, groupHousingsA);
  const groupB: GroupDTO = genGroupDTO(currentUser, groupHousingsB);
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

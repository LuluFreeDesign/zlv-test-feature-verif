import { faker } from '@faker-js/faker/locale/fr';
import {
  type BaseHousingOwnerDTO,
  type CampaignDTO,
  type DatafoncierHousing,
  type DocumentDTO,
  type DraftDTO,
  type EstablishmentDTO,
  type EventUnionDTO,
  type FileUploadDTO,
  type GroupDTO,
  type HousingDTO,
  type LocalityDTO,
  type NoteDTO,
  type OwnerDTO,
  type Precision,
  PRECISION_CATEGORY_VALUES,
  type ProspectDTO,
  type SignupLinkDTO,
  type UserDTO
} from '@zerologementvacant/models';

const campaigns: CampaignDTO[] = [];
const campaignDrafts = new Map<
  CampaignDTO['id'],
  ReadonlyArray<Pick<DraftDTO, 'id'>>
>();
const campaignHousings = new Map<
  CampaignDTO['id'],
  ReadonlyArray<Pick<HousingDTO, 'id'>>
>();

const datafoncierHousings: DatafoncierHousing[] = [];

const documents = new Map<DocumentDTO['id'], DocumentDTO>();

const drafts: DraftDTO[] = [];
const draftCampaigns = new Map<DraftDTO['id'], Pick<CampaignDTO, 'id'>>();

const establishments: EstablishmentDTO[] = [];

const files: FileUploadDTO[] = [];

const groups: GroupDTO[] = [];
const groupHousings = new Map<
  GroupDTO['id'],
  ReadonlyArray<Pick<HousingDTO, 'id'>>
>();

const owners: OwnerDTO[] = [];

const housings: HousingDTO[] = [];
const housingCampaigns = new Map<
  HousingDTO['id'],
  ReadonlyArray<Pick<CampaignDTO, 'id'>>
>();
const housingDocuments = new Map<
  HousingDTO['id'],
  ReadonlyArray<Pick<DocumentDTO, 'id'>>
>();
const housingEvents = new Map<
  HousingDTO['id'],
  EventUnionDTO<
    | 'housing:created'
    | 'housing:occupancy-updated'
    | 'housing:status-updated'
  >[]
>();
const housingFiles = new Map<HousingDTO['id'], FileUploadDTO[]>();
const housingNotes = new Map<HousingDTO['id'], string[]>();
const housingOwners = new Map<
  HousingDTO['id'],
  ReadonlyArray<BaseHousingOwnerDTO & Pick<OwnerDTO, 'id'>>
>();
const housingPrecisions = new Map<
  HousingDTO['id'],
  ReadonlyArray<Precision['id']>
>();

const localities = new Map<LocalityDTO['geoCode'], LocalityDTO>();

const notes: NoteDTO[] = [];

// Real ZLV precision referential (points de blocage / évolutions / dispositifs).
const PRECISION_LABELS: Record<Precision['category'], string[]> = {
  'dispositifs-incitatifs': [
    'Conventionnement avec travaux',
    'Conventionnement sans travaux',
    'Aides locales travaux',
    'Aides à la gestion locative',
    'Intermédiation Locative (IML)',
    'Dispositif fiscal',
    'Prime locale vacance',
    'Prime vacance France Ruralités',
    'Ma Prime Renov',
    'Prime Rénovation Globale',
    'Prime locale rénovation énergétique',
    'Accompagnement à la vente',
    'Autre'
  ],
  'dispositifs-coercitifs': [
    'ORI ou RHI - THIRORI',
    'Bien sans maître',
    'Abandon manifeste',
    'DIA - préemption',
    'Procédure d’habitat indigne (hygiène, insalubrité, péril)',
    'Permis de louer',
    'Permis de diviser',
    'Autre'
  ],
  'hors-dispositif-public': [
    'Accompagné par un professionnel (architecte, agent immobilier, etc.)',
    'Propriétaire autonome'
  ],
  'blocage-involontaire': [
    'Mise en location ou vente infructueuse',
    'Succession en cours',
    'Défaut d’entretien / Nécessité de travaux',
    'Problème de financement / Dossier non-éligible',
    'Manque de conseils en amont de l’achat',
    'En incapacité (âge, handicap, précarité ...)'
  ],
  'blocage-volontaire': [
    'Réserve personnelle ou pour une autre personne',
    'Stratégie de gestion',
    'Mauvaise expérience locative',
    'Montants des travaux perçus comme trop importants',
    'Refus catégorique, sans raison'
  ],
  'immeuble-environnement': [
    'Pas d’accès indépendant',
    'Immeuble dégradé',
    'Ruine / Immeuble à démolir',
    'Nuisances à proximité',
    'Risques Naturels / Technologiques'
  ],
  'tiers-en-cause': [
    'Entreprise(s) en défaut',
    'Copropriété en désaccord',
    'Expertise judiciaire',
    'Autorisation d’urbanisme refusée / Blocage ABF',
    'Interdiction de location'
  ],
  travaux: ['À venir', 'En cours', 'Terminés'],
  occupation: ['À venir', 'En cours', 'Nouvelle occupation'],
  mutation: ['À venir', 'En cours', 'Effectuée']
};

const precisions: Precision[] = PRECISION_CATEGORY_VALUES.flatMap((category) =>
  PRECISION_LABELS[category].map((label) => ({
    id: faker.string.uuid(),
    category,
    label
  }))
);

const prospects: ProspectDTO[] = [];

const signupLinks: SignupLinkDTO[] = [];

const users: UserDTO[] = [];

function reset(): void {
  campaigns.length = 0;
  campaignDrafts.clear();
  campaignHousings.clear();
  datafoncierHousings.length = 0;
  drafts.length = 0;
  draftCampaigns.clear();
  establishments.length = 0;
  groups.length = 0;
  groupHousings.clear();
  housings.length = 0;
  housingCampaigns.clear();
  housingEvents.clear();
  housingNotes.clear();
  housingOwners.clear();
  housingPrecisions.clear();
  localities.clear();
  notes.length = 0;
  owners.length = 0;
  prospects.length = 0;
  signupLinks.length = 0;
  users.length = 0;
}

// Export immediately to avoid Vite SSR module wrapping
export default {
  campaigns,
  campaignDrafts,
  campaignHousings,
  datafoncierHousings,
  documents,
  drafts,
  draftCampaigns,
  establishments,
  files,
  groups,
  groupHousings,
  housings,
  housingCampaigns,
  housingDocuments,
  housingEvents,
  housingFiles,
  housingNotes,
  housingOwners,
  housingPrecisions,
  localities,
  notes,
  owners,
  precisions,
  prospects,
  signupLinks,
  users,

  reset
};

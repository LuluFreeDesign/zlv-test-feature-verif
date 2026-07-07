import { fr } from '@codegouvfr/react-dsfr';
import Breadcrumb from '@codegouvfr/react-dsfr/Breadcrumb';
import Button from '@codegouvfr/react-dsfr/Button';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { yupResolver } from '@hookform/resolvers/yup';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { skipToken } from '@reduxjs/toolkit/query';
import {
  type EnergyConsumption,
  ENERGY_CONSUMPTION_VALUES,
  HOUSING_STATUS_VALUES,
  Occupancy,
  OCCUPANCY_VALUES,
  PRECISION_CATEGORY_VALUES
} from '@zerologementvacant/models';
import { useEffect, useRef, useState } from 'react';
import {
  Controller,
  FormProvider,
  useForm,
  type SubmitHandler
} from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router';
import type { HousingFiltersDTO } from '@zerologementvacant/models';
import { array, number, object, string, type InferType } from 'yup';

import DPE from '~/components/DPE/DPE';
import HousingEditionMobilizationTab from '~/components/HousingEdition/HousingEditionMobilizationTab';
import ReviewHousingList from '~/components/HousingReview/ReviewHousingList';
import ReviewOwnersSection from '~/components/HousingReview/ReviewOwnersSection';
import EnergyConsumptionSelect from '~/components/HousingListFilters/EnergyConsumptionSelect';
import OccupancySelect from '~/components/HousingListFilters/OccupancySelect';
import Map from '~/components/Map/Map';
import AppTextInputNext from '~/components/_app/AppTextInput/AppTextInputNext';
import { useAppSelector } from '~/hooks/useStore';
import { useNotification } from '~/hooks/useNotification';
import { HousingStates } from '~/models/HousingState';
import { useFindHousingQuery, useUpdateHousingMutation } from '~/services/housing.service';
import { useCreateNoteByHousingMutation } from '~/services/note.service';
import {
  useFindPrecisionsByHousingQuery,
  useSaveHousingPrecisionsMutation
} from '~/services/precision.service';

const schema = object({
  occupancy: string()
    .required("Veuillez renseigner l'occupation actuelle")
    .oneOf(OCCUPANCY_VALUES),
  occupancyIntended: string()
    .oneOf(OCCUPANCY_VALUES)
    .required()
    .nullable()
    .default(null),
  status: number()
    .required('Veuillez renseigner le statut de suivi')
    .oneOf(HOUSING_STATUS_VALUES)
    .nullable(),
  subStatus: string()
    .trim()
    .required()
    .nullable()
    .when('status', ([status], currentSchema) =>
      HousingStates.find((state) => state.status === status)?.subStatusList
        ?.length
        ? currentSchema.required('Veuillez renseigner le sous-statut de suivi')
        : currentSchema
    ),
  note: string().required().nullable(),
  precisions: array(
    object({
      id: string().required(),
      category: string().oneOf(PRECISION_CATEGORY_VALUES).required(),
      label: string().required()
    }).required()
  ).required(),
  actualEnergyConsumption: string()
    .oneOf(['A', 'B', 'C', 'D', 'E', 'F', 'G'])
    .nullable()
    .optional()
    .default(null)
}).required();

type ReviewFormSchema = InferType<typeof schema>;

const unsavedModal = createModal({
  id: 'review-unsaved-changes',
  isOpenedByDefault: false
});

// Field widths matching the Figma (selects are not full-width).
const OCCUPANCY_WIDTH = '21rem';
const STATUS_WIDTH = '24rem';
const DPE_WIDTH = '18rem';

/** Deterministic fake "représentatif" DPE label per housing (no ADEME data). */
function fakeRepresentativeDpe(housingId: string): EnergyConsumption {
  const sum = Array.from(housingId).reduce(
    (total, char) => total + char.charCodeAt(0),
    0
  );
  return ENERGY_CONSUMPTION_VALUES[sum % ENERGY_CONSUMPTION_VALUES.length];
}

/**
 * Housing review flow, launched from the Parc de logements ("Éditer" on a
 * housing row). It iterates over the currently filtered parc list, starting at
 * the housing that was clicked. "Enregistrer et passer au suivant" walks the
 * list.
 */
function HousingReviewView() {
  const navigate = useNavigate();
  const location = useLocation();

  // The set of housings to review is described by filters passed via the router
  // state (parc filters + selection, a single owner, a group…). Falls back to
  // the current parc filters when opened directly.
  const storeFilters = useAppSelector((state) => state.housing.filters);
  const stateFilters = (location.state as { filters?: HousingFiltersDTO } | null)
    ?.filters;
  const filters = stateFilters ?? storeFilters;
  const { data: housingResult, isLoading: isLoadingHousings } =
    useFindHousingQuery({
      filters,
      pagination: { paginate: true, page: 1, perPage: 10_000 }
    });
  const housings = housingResult?.entities ?? [];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pendingAction = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (housings.length > 0 && selectedId === null) {
      setSelectedId(housings[0].id);
    }
  }, [housings, selectedId]);

  const selectedHousing =
    housings.find((housing) => housing.id === selectedId) ?? null;
  const selectedIndex = housings.findIndex(
    (housing) => housing.id === selectedId
  );

  const { data: housingPrecisions } = useFindPrecisionsByHousingQuery(
    selectedHousing ? { housingId: selectedHousing.id } : skipToken
  );

  const [updateHousing, housingUpdateMutation] = useUpdateHousingMutation();
  const [saveHousingPrecisions] = useSaveHousingPrecisionsMutation();
  const [createNote] = useCreateNoteByHousingMutation();

  useNotification({
    toastId: 'review-housing-update',
    isError: housingUpdateMutation.isError,
    isLoading: housingUpdateMutation.isLoading,
    isSuccess: housingUpdateMutation.isSuccess,
    message: {
      error: 'Impossible d’enregistrer le logement',
      loading: 'Enregistrement...',
      success: 'Logement enregistré'
    }
  });

  const form = useForm<ReviewFormSchema>({
    values: {
      occupancy: selectedHousing?.occupancy ?? Occupancy.UNKNOWN,
      occupancyIntended: selectedHousing?.occupancyIntended ?? null,
      status: selectedHousing?.status ?? null,
      subStatus: selectedHousing?.subStatus ?? null,
      note: null,
      precisions: housingPrecisions ?? [],
      actualEnergyConsumption: selectedHousing?.actualEnergyConsumption ?? null
    },
    mode: 'onSubmit',
    resolver: yupResolver(schema)
  });

  function goToIndex(index: number): void {
    const target = housings[index];
    if (target) {
      setSelectedId(target.id);
    }
  }

  /** Run an action, guarding against unsaved changes in the current form. */
  function guarded(action: () => void): void {
    if (form.formState.isDirty) {
      pendingAction.current = action;
      unsavedModal.open();
    } else {
      action();
    }
  }

  function selectHousing(id: string): void {
    guarded(() => setSelectedId(id));
  }

  function back(): void {
    guarded(() => navigate(-1));
  }

  const submit: SubmitHandler<ReviewFormSchema> = (payload) => {
    if (!selectedHousing) {
      return;
    }

    updateHousing({
      ...selectedHousing,
      occupancy: payload.occupancy ?? selectedHousing.occupancy,
      occupancyIntended:
        payload.occupancyIntended ?? selectedHousing.occupancyIntended,
      status: payload.status ?? selectedHousing.status,
      subStatus: payload.subStatus ?? selectedHousing.subStatus,
      actualEnergyConsumption:
        payload.actualEnergyConsumption ??
        selectedHousing.actualEnergyConsumption
    });

    if (form.formState.dirtyFields.precisions) {
      saveHousingPrecisions({
        housing: selectedHousing.id,
        precisions: payload.precisions.map((precision) => precision.id)
      });
    }

    if (payload.note) {
      createNote({ id: selectedHousing.id, content: payload.note });
    }

    if (selectedIndex >= 0 && selectedIndex < housings.length - 1) {
      goToIndex(selectedIndex + 1);
    }
  };

  const housingAddress = selectedHousing?.rawAddress.join(', ') ?? '';
  const streetViewUrl = selectedHousing
    ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selectedHousing.latitude},${selectedHousing.longitude}`
    : undefined;
  const separatorBorder = `1px solid ${fr.colors.decisions.border.default.grey.default}`;

  return (
    <Box sx={{ px: '1.5rem', pb: '1.5rem' }}>
      {/* Sticky header: title + navigation + save button */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: fr.colors.decisions.background.default.grey.default,
          pt: '1.5rem',
          pb: '1rem',
          mb: '1rem',
          borderBottom: separatorBorder
        }}
      >
        <Breadcrumb
          className="fr-mb-1w"
          currentPageLabel="Passer en revue les logements"
          segments={[
            {
              label: 'Parc de logements',
              linkProps: { to: '/parc-de-logements' }
            }
          ]}
        />

        <Stack
          direction="row"
          spacing="1rem"
          useFlexGap
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap'
          }}
        >
          <Typography component="h1" variant="h4" sx={{ mb: 0 }}>
            Passer en revue les logements
          </Typography>

          <Stack direction="row" spacing="0.5rem" useFlexGap>
            <Button priority="secondary" onClick={back}>
              Retour
            </Button>
            <Button
              priority="primary"
              iconId="fr-icon-check-line"
              onClick={form.handleSubmit(submit)}
              disabled={!selectedHousing}
            >
              Enregistrer et passer au suivant
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Grid container columnSpacing="1.5rem">
        {/* Left column: housings to review */}
        <Grid
          size={{ xs: 12, md: 3 }}
          sx={{ borderRight: { md: separatorBorder }, pr: { md: '1rem' } }}
        >
          <Typography component="h2" variant="h6" sx={{ mb: '0.5rem' }}>
            Logements à éditer
          </Typography>
          {isLoadingHousings ? (
            <Typography>Chargement…</Typography>
          ) : (
            <ReviewHousingList
              housings={housings}
              selectedId={selectedId}
              onSelect={selectHousing}
            />
          )}
        </Grid>

        {/* Right area: address + editable details */}
        <Grid size={{ xs: 12, md: 9 }}>
          {selectedHousing ? (
            <FormProvider {...form}>
              <Stack spacing="1.5rem" useFlexGap>
                {/* Address + "Voir la fiche" — its right edge aligns with the map */}
                <Stack
                  direction="row"
                  spacing="1rem"
                  useFlexGap
                  sx={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap'
                  }}
                >
                  <Typography component="h2" variant="h4">
                    {housingAddress}
                  </Typography>
                  <Button
                    priority="tertiary"
                    size="small"
                    iconId="ri-external-link-line"
                    iconPosition="right"
                    linkProps={{
                      to: `/logements/${selectedHousing.id}`,
                      target: '_blank',
                      rel: 'noopener noreferrer'
                    }}
                  >
                    Voir la fiche de ce logement
                  </Button>
                </Stack>

                <Grid container columnSpacing="1.5rem">
                  {/* Center: owners + occupation & follow-up */}
                  <Grid size={{ xs: 12, md: 7 }}>
                    <Stack spacing="1.5rem" useFlexGap>
                      <ReviewOwnersSection housing={selectedHousing} />

                      <Stack component="section" spacing="1rem" useFlexGap>
                        <Typography component="h3" variant="h6">
                          Occupation et suivi
                        </Typography>

                        <Box sx={{ maxWidth: OCCUPANCY_WIDTH }}>
                          <Controller<ReviewFormSchema, 'occupancy'>
                            name="occupancy"
                            render={({ field, fieldState }) => (
                              <OccupancySelect
                                label="Occupation actuelle"
                                disabled={field.disabled}
                                error={fieldState.error?.message}
                                invalid={fieldState.invalid}
                                value={field.value as Occupancy}
                                onChange={field.onChange}
                              />
                            )}
                          />
                        </Box>

                        <Box sx={{ maxWidth: OCCUPANCY_WIDTH }}>
                          <Controller<ReviewFormSchema, 'occupancyIntended'>
                            name="occupancyIntended"
                            render={({ field, fieldState }) => (
                              <OccupancySelect
                                label="Occupation prévisionnelle"
                                disabled={field.disabled}
                                error={fieldState.error?.message}
                                invalid={fieldState.invalid}
                                value={field.value as Occupancy | null}
                                onChange={field.onChange}
                              />
                            )}
                          />
                        </Box>

                        <Box sx={{ maxWidth: STATUS_WIDTH }}>
                          <HousingEditionMobilizationTab />
                        </Box>
                      </Stack>
                    </Stack>
                  </Grid>

                  {/* Right: note, map, DPE */}
                  <Grid size={{ xs: 12, md: 5 }}>
                    <Stack spacing="1.5rem" useFlexGap>
                      <Stack spacing="0.75rem" useFlexGap>
                      <AppTextInputNext<ReviewFormSchema, 'note'>
                        label="Nouvelle note"
                        name="note"
                        textArea
                        nativeTextAreaProps={{ rows: 6 }}
                        mapValue={(value) => value ?? ''}
                        contramapValue={(value) =>
                          value === '' ? null : value
                        }
                      />

                      <Box>
                        <Map
                          housingList={[selectedHousing]}
                          hideClusterizeControl
                          viewState={{
                            longitude: selectedHousing.longitude,
                            latitude: selectedHousing.latitude,
                            zoom: 16,
                            bearing: 0,
                            pitch: 0,
                            padding: { top: 0, bottom: 0, left: 0, right: 0 }
                          }}
                          style={{
                            height: '350px',
                            minHeight: '350px',
                            width: '100%'
                          }}
                        />
                        {streetViewUrl ? (
                          <Box sx={{ mt: '0.5rem', textAlign: 'right' }}>
                            <Button
                              priority="secondary"
                              size="medium"
                              iconId="ri-external-link-line"
                              iconPosition="right"
                              linkProps={{
                                href: streetViewUrl,
                                target: '_blank',
                                rel: 'noopener noreferrer'
                              }}
                            >
                              Voir le bâtiment
                            </Button>
                          </Box>
                        ) : null}
                      </Box>
                      </Stack>

                      <Stack component="section" spacing="0.25rem" useFlexGap>
                        <Typography sx={{ fontWeight: 500 }}>
                          Étiquette DPE représentatif (source : ADEME)
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: fr.colors.decisions.text.mention.grey.default
                          }}
                        >
                          Issue du DPE le plus récent du bâtiment
                        </Typography>
                        <DPE value={fakeRepresentativeDpe(selectedHousing.id)} />
                      </Stack>

                      <Box sx={{ maxWidth: DPE_WIDTH }}>
                        <Controller<ReviewFormSchema, 'actualEnergyConsumption'>
                          name="actualEnergyConsumption"
                          render={({ field, fieldState }) => (
                            <EnergyConsumptionSelect
                              label="Étiquette DPE renseignée"
                              disabled={field.disabled}
                              error={fieldState.error?.message}
                              value={field.value as EnergyConsumption | null}
                              onChange={field.onChange}
                            />
                          )}
                        />
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </Stack>
            </FormProvider>
          ) : (
            <Typography>Aucun logement à éditer.</Typography>
          )}
        </Grid>
      </Grid>

      <unsavedModal.Component
        title="Modifications non enregistrées"
        buttons={[
          { children: 'Annuler', priority: 'secondary', doClosesModal: true },
          {
            children: 'Quitter sans enregistrer',
            priority: 'primary',
            onClick: () => {
              const action = pendingAction.current;
              pendingAction.current = null;
              action?.();
            }
          }
        ]}
      >
        <Typography>
          Vous avez des modifications en cours sur ce logement qui ne sont pas
          enregistrées. Si vous continuez, elles seront perdues.
        </Typography>
      </unsavedModal.Component>
    </Box>
  );
}

export default HousingReviewView;

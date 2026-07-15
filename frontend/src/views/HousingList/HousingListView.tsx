import { Alert } from '@codegouvfr/react-dsfr/Alert';
import Button from '@codegouvfr/react-dsfr/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import Tooltip from '~/components/ui/Tooltip/Tooltip';
import createGroupAddHousingModal from '~/components/Group/GroupAddHousingModal';
import createGroupCreationModal from '~/components/Group/GroupCreationModal';
import { HousingDisplaySwitch } from '~/components/HousingDisplaySwitch/HousingDisplaySwitch';
import { HousingEditionProvider } from '~/components/HousingEdition/useHousingEdition';
import HousingFiltersBadges from '~/components/HousingFiltersBadges/HousingFiltersBadges';
import HousingListFiltersSidemenu from '~/components/HousingListFilters/HousingListFiltersSidemenu';
import AppSearchBar from '~/components/_app/AppSearchBar/AppSearchBar';
import HousingCreationModal from '~/components/modals/HousingCreationModal/HousingCreationModal';
import { useDocumentTitle } from '~/hooks/useDocumentTitle';
import { useFilters } from '~/hooks/useFilters';
import { useNotification } from '~/hooks/useNotification';
import ReviewHousingsButton from '~/components/HousingReview/ReviewHousingsButton';
import { useSelection } from '~/hooks/useSelection';
import { useAppDispatch, useAppSelector } from '~/hooks/useStore';
import { useUser } from '~/hooks/useUser';
import type { Housing } from '~/models/Housing';
import { pluralize } from '~/utils/stringUtils';
import {
  useAddGroupHousingMutation,
  useCreateGroupMutation
} from '~/services/group.service';
import { useCountHousingQuery } from '~/services/housing.service';
import housingSlice from '~/store/reducers/housingReducer';
import HousingListMap from './HousingListMap';
import HousingListTabs from './HousingListTabs';
import { useHousingListTabs } from './HousingListTabsProvider';

const groupAddHousingModal = createGroupAddHousingModal();
const groupCreationModal = createGroupCreationModal();

const HousingListView = () => {
  useDocumentTitle('Parc de logements');

  const {
    expand,
    filters,
    setExpand,
    setFilters,
    onChangeFilters,
    onResetFilters
  } = useFilters({
    storage: 'store'
  });

  const dispatch = useAppDispatch();
  const { changeView } = housingSlice.actions;
  const { view } = useAppSelector((state) => state.housing);

  const searchWithQuery = (query: string) => {
    setFilters({
      ...filters,
      query
    });
  };

  const location: { state?: RouterState } = useLocation();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(location.state?.alert ?? '');
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  function onFinish(housing: Housing) {
    setAlert(
      'Le logement sélectionné a bien été ajouté à votre parc de logements.'
    );
    setIsAlertVisible(true);
    navigate(`/logements/${housing.id}`);
  }

  const { isVisitor } = useUser();

  const [createGroup, createGroupMutation] = useCreateGroupMutation();
  useNotification({
    toastId: 'create-group',
    isError: createGroupMutation.isError,
    isLoading: createGroupMutation.isLoading,
    isSuccess: createGroupMutation.isSuccess,
    message: {
      error: 'Impossible de créer le groupe',
      loading: 'Création du groupe...',
      success: 'Groupe créé !'
    }
  });

  const { activeStatus } = useHousingListTabs();
  const { data: totalCount } = useCountHousingQuery({
    ...filters,
    status: activeStatus.value
  });
  const { selected } = useSelection(totalCount?.housing ?? 0, {
    storage: 'store'
  });
  const { data: count, isLoading: isCounting } = useCountHousingQuery({
    ...filters,
    all: selected.all,
    housingIds: selected.ids,
    status: activeStatus.value
  });

  const [addGroupHousing, addGroupHousingMutation] =
    useAddGroupHousingMutation();
  useNotification({
    toastId: 'add-group-housing',
    isError: addGroupHousingMutation.isError,
    isLoading: addGroupHousingMutation.isLoading,
    isSuccess: addGroupHousingMutation.isSuccess,
    message: {
      error: 'Impossible d’ajouter ces logements au groupe',
      loading: 'Ajout des logements au groupe...',
      success: 'Logements ajoutés au groupe !'
    }
  });

  // Number of housings the action buttons apply to: the current selection if
  // any, otherwise the whole filtered list of the active tab. Both "Passer en
  // revue" and "Intégrer dans un groupe" share this exact same set (same
  // filters/selection), so they always agree.
  const filteredTotal = count?.housing ?? 0;
  const actionCount = selected.all
    ? Math.max(filteredTotal - selected.ids.length, 0)
    : selected.ids.length > 0
      ? selected.ids.length
      : filteredTotal;
  const reviewFilters = {
    ...filters,
    status: activeStatus.value,
    all: selected.all,
    housingIds: selected.ids
  };

  // Actions shown inside the table header row (next to the count / inside the
  // selection bar): review + add-to-group. Both default to the whole filtered
  // list when nothing is selected.
  const headerActions = (
    <>
      <ReviewHousingsButton filters={reviewFilters} count={actionCount} />
      <Button
        priority="primary"
        iconId="fr-icon-building-line"
        onClick={groupAddHousingModal.open}
      >
        Intégrer {actionCount} {pluralize(actionCount)('logement')} dans un
        groupe
      </Button>
    </>
  );

  return (
    <HousingEditionProvider>
      <Stack direction="row">
        <HousingListFiltersSidemenu
          filters={filters}
          expand={expand}
          onChange={onChangeFilters}
          onReset={onResetFilters}
          onClose={() => setExpand(false)}
        />

        <Grid
          container
          component="section"
          sx={{ padding: '1.5rem', width: '100%' }}
        >
          <Grid size="grow">
            <Stack
              component="header"
              spacing="0.75rem"
              useFlexGap
              sx={{ flexGrow: 1 }}
            >
              <Alert
                severity="success"
                description={alert}
                closable
                small
                className="fr-mb-2w"
                isClosed={!isAlertVisible}
                onClose={() => {
                  setIsAlertVisible(false);
                }}
                {...{ role: 'status' }}
              />

              <Stack
                direction="row"
                spacing="0.75rem"
                useFlexGap
                sx={{ alignItems: 'center' }}
              >
                <Stack sx={{ flex: 1 }}>
                  <AppSearchBar
                    initialQuery={filters.query}
                    label="Rechercher (propriétaire, identifiant fiscal, ref. cadastrale...)"
                    placeholder="Rechercher (propriétaire, identifiant fiscal, ref. cadastrale...)"
                    onSearch={searchWithQuery}
                  />
                </Stack>
                <Tooltip
                  align="start"
                  place="bottom"
                  title="Pour retrouver une liste de logements, copiez-collez dans la barre de recherche la liste de leurs identifiants fiscaux séparés par un espace. Exemple : « 750123456789 750123456790 750123456791 »"
                />
                <HousingDisplaySwitch />
              </Stack>

              <HousingFiltersBadges
                filters={filters}
                onChange={onChangeFilters}
              />
            </Stack>

            <Stack spacing="1rem" useFlexGap>
              <Stack
                direction="row"
                component="ul"
               
                sx={{ justifyContent: 'flex-end', listStyle: 'none', padding: 0, margin: 0 }}
              >
                {!isVisitor && (
                  <li>
                    <HousingCreationModal onFinish={onFinish} />
                  </li>
                )}
              </Stack>

              {view === 'map' ? (
                <HousingListMap filters={filters} />
              ) : (
                <HousingListTabs filters={filters} headerActions={headerActions} />
              )}
            </Stack>
          </Grid>
        </Grid>
      </Stack>


      <groupAddHousingModal.Component
        count={count}
        isCounting={isCounting}
        onBack={() => {
          groupAddHousingModal.close();
        }}
        onExistingGroup={(group) => {
          addGroupHousing({
            id: group.id,
            all: selected.all,
            ids: selected.ids,
            filters: {
              ...filters,
              status: activeStatus.value
            }
          })
            .unwrap()
            .then(() => {
              groupAddHousingModal.close();
              navigate(`/groupes/${group.id}`);
            });
        }}
        onNewGroup={() => {
          groupAddHousingModal.close();
          groupCreationModal.open();
        }}
      />

      <groupCreationModal.Component
        count={count}
        isCounting={isCounting}
        onBack={() => {
          groupCreationModal.close();
          groupAddHousingModal.open();
        }}
        onConfirm={({ title, description }) => {
          createGroup({
            title,
            description,
            housing: {
              all: selected.all,
              ids: selected.ids,
              filters: {
                ...filters,
                status: activeStatus.value
              }
            }
          })
            .unwrap()
            .then(({ group, status }) => {
              groupCreationModal.close();
              navigate(`/groupes/${group.id}`, {
                state: {
                  alert:
                    status === 202
                      ? 'Votre nouveau groupe a bien été créé. Les logements vont être ajoutés au fur et à mesure...'
                      : 'Votre nouveau groupe a bien été créé et les logements sélectionnés ont bien été ajoutés.'
                }
              });
            });
        }}
      />
    </HousingEditionProvider>
  );
};

interface RouterState {
  alert?: string;
}

export default HousingListView;

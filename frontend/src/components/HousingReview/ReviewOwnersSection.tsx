import Button from '@codegouvfr/react-dsfr/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { skipToken } from '@reduxjs/toolkit/query';
import type {
  AwaitingOwnerRank,
  InactiveOwnerRank,
  OwnerRank
} from '@zerologementvacant/models';
import { Array, Equivalence, Order, pipe } from 'effect';
import type { NonEmptyArray } from 'effect/Array';
import { useState } from 'react';

import createOwnerAttachmentModal from '~/components/Owner/HousingOwnerAdditionModals/OwnerAttachmentModal';
import createOwnerSearchModal from '~/components/Owner/HousingOwnerAdditionModals/OwnerSearchModal';
import HousingOwnerEditionAside, {
  type HousingOwnerEditionSchema
} from '~/components/Owner/HousingOwnerEditionAside';
import HousingOwnerTable from '~/components/Owner/HousingOwnerTable';
import { useHousingOwners } from '~/components/Owner/useHousingOwners';
import { useNotification } from '~/hooks/useNotification';
import {
  computeOwnersAfterRankTransition,
  rankToLabel,
  type OwnerRankLabel
} from '~/models/HousingOwnerRank';
import type { Housing } from '~/models/Housing';
import type { HousingOwner, Owner } from '~/models/Owner';
import {
  useUpdateHousingOwnersMutation,
  useUpdateOwnerMutation
} from '~/services/owner.service';

// Dedicated modal ids so they don't collide with HousingOwnersView's instances.
const ownerSearchModal = createOwnerSearchModal('review-owner-search-modal');
const ownerAttachmentModal = createOwnerAttachmentModal(
  'review-owner-attachment-modal'
);

export interface ReviewOwnersSectionProps {
  housing: Housing | null;
}

/**
 * Reduced version of the housing-owners edition screen (`HousingOwnersView`),
 * used inside the review flow: a compact owners table whose "Éditer" button
 * opens the exact same side panel (`HousingOwnerEditionAside`), plus the same
 * "Ajouter un propriétaire" flow.
 */
function ReviewOwnersSection(props: Readonly<ReviewOwnersSectionProps>) {
  const { housing } = props;
  const {
    owner: primaryOwner,
    housingOwners,
    activeOwners,
    inactiveOwners,
    secondaryOwners,
    findOwnersQuery: { isLoading }
  } = useHousingOwners(housing?.id ?? skipToken);

  const [updateOwner, updateOwnerMutation] = useUpdateOwnerMutation();
  const [updateHousingOwners, updateHousingOwnersMutation] =
    useUpdateHousingOwnersMutation();

  useNotification({
    toastId: 'review-housing-owner-edition',
    isError: updateOwnerMutation.isError || updateHousingOwnersMutation.isError,
    isLoading:
      updateOwnerMutation.isLoading || updateHousingOwnersMutation.isLoading,
    isSuccess:
      updateOwnerMutation.isSuccess || updateHousingOwnersMutation.isSuccess,
    message: {
      error: 'Erreur lors de la modification du propriétaire',
      loading: 'Modification du propriétaire...',
      success: 'Propriétaire modifié avec succès'
    }
  });

  const [selectedOwner, setSelectedOwner] = useState<HousingOwner | null>(null);
  const [asideOpen, setAsideOpen] = useState(false);
  const [ownerToAdd, setOwnerToAdd] = useState<Owner | null>(null);

  function onOwnerEdit(housingOwner: HousingOwner): void {
    setSelectedOwner(housingOwner);
    setAsideOpen(true);
  }

  function closeAside(): void {
    setAsideOpen(false);
    setSelectedOwner(null);
  }

  async function onSave(payload: HousingOwnerEditionSchema): Promise<void> {
    if (!selectedOwner || !housing || !inactiveOwners || !secondaryOwners) {
      return;
    }

    const OwnerEquivalence = Equivalence.struct({
      email: Equivalence.strict<string | null>(),
      birthDate: Equivalence.strict<string | null>(),
      phone: Equivalence.strict<string | null>(),
      banAddress: Equivalence.make<{ id: string } | null>(
        (a, b) => a !== null && b !== null && a.id === b.id
      )
    });
    const ownerEquals = OwnerEquivalence(
      {
        email: selectedOwner.email,
        birthDate: selectedOwner.birthDate,
        phone: selectedOwner.phone,
        banAddress: selectedOwner.banAddress?.banId
          ? { id: selectedOwner.banAddress.banId }
          : null
      },
      {
        email: payload.email,
        birthDate: payload.birthDate,
        phone: payload.phone,
        banAddress: payload.banAddress?.id ? { id: payload.banAddress.id } : null
      }
    );

    if (!ownerEquals) {
      await updateOwner({
        id: selectedOwner.id,
        fullName: selectedOwner.fullName,
        email: payload.email,
        birthDate: payload.birthDate,
        phone: payload.phone,
        banAddress: payload.banAddress
          ? {
              label: payload.banAddress.label,
              banId: payload.banAddress.id,
              score: payload.banAddress.score,
              longitude: payload.banAddress.longitude,
              latitude: payload.banAddress.latitude,
              postalCode: payload.banAddress.postalCode ?? '',
              city: payload.banAddress.city ?? ''
            }
          : null,
        additionalAddress: payload.additionalAddress
      }).unwrap();
    }

    const rankBefore = rankToLabel(selectedOwner.rank);
    const rankAfter: OwnerRankLabel = payload.isActive
      ? payload.rank!
      : rankToLabel(
          payload.inactiveRank as Exclude<InactiveOwnerRank, AwaitingOwnerRank>
        );

    const allOwners = [...activeOwners, ...inactiveOwners];
    const nextHousingOwners = computeOwnersAfterRankTransition(allOwners, {
      id: selectedOwner.id,
      from: rankBefore,
      to: rankAfter
    });

    if (rankBefore !== rankAfter) {
      await updateHousingOwners({
        housingId: housing.id,
        housingOwners: nextHousingOwners as Array<HousingOwner>
      }).unwrap();
    }

    closeAside();
  }

  function onSelectOwner(selected: Owner): void {
    setOwnerToAdd(selected);
    ownerSearchModal.close();
    ownerAttachmentModal.open();
  }

  function onBackFromAttachment(): void {
    setOwnerToAdd(null);
    ownerAttachmentModal.close();
    ownerSearchModal.open();
  }

  function onConfirmAttachment(): void {
    if (ownerToAdd) {
      onAddOwner(ownerToAdd);
    }
    setOwnerToAdd(null);
    ownerAttachmentModal.close();
  }

  function onAddOwner(owner: Owner): void {
    if (!housing || activeOwners.some((ho) => ho.id === owner.id)) {
      return;
    }

    const firstAvailableRank: OwnerRank = !primaryOwner
      ? 1
      : pipe(
          activeOwners as NonEmptyArray<HousingOwner>,
          Array.map((ho) => ho.rank),
          Array.max(Order.number),
          (rank) => (rank + 1) as OwnerRank
        );
    const nextHousingOwners = activeOwners
      .concat(inactiveOwners ?? [])
      .concat({
        ...owner,
        rank: firstAvailableRank,
        idprocpte: null,
        idprodroit: null,
        locprop: null,
        propertyRight: null,
        relativeLocation: null,
        absoluteDistance: null
      });

    updateHousingOwners({ housingId: housing.id, housingOwners: nextHousingOwners });
  }

  return (
    <Stack spacing="0.75rem" useFlexGap>
      {/* Let the reduced table size its columns to content (no horizontal
          scroll); just nudge the name column a bit wider. */}
      <Box
        sx={{
          // Fit within the column on desktop, allow horizontal scroll on mobile.
          '& .fr-table': { overflowX: { xs: 'auto', md: 'visible' } },
          '& table': { width: '100%' },
          '& th:nth-of-type(1), & td:nth-of-type(1)': { minWidth: '11rem' }
        }}
      >
        <HousingOwnerTable
          title="Propriétaires"
          action={
            <Button
              priority="secondary"
              size="small"
              iconId="fr-icon-add-line"
              onClick={ownerSearchModal.open}
              disabled={!housing}
            >
              Ajouter un propriétaire
            </Button>
          }
          housing={housing}
          owners={activeOwners}
          isLoading={isLoading}
          columns={['name', 'rank', 'actions']}
          onEdit={onOwnerEdit}
        />
      </Box>

      <ownerSearchModal.Component
        address={housing?.rawAddress?.join(' ') ?? ''}
        exclude={housingOwners ?? []}
        onSelect={onSelectOwner}
      />
      <ownerAttachmentModal.Component
        address={housing?.rawAddress?.join(' ') ?? ''}
        owner={ownerToAdd}
        onBack={onBackFromAttachment}
        onConfirm={onConfirmAttachment}
      />

      <HousingOwnerEditionAside
        open={asideOpen}
        onClose={closeAside}
        housingOwner={selectedOwner}
        onSave={onSave}
      />
    </Stack>
  );
}

export default ReviewOwnersSection;

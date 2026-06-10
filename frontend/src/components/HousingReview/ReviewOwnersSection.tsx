import { skipToken } from '@reduxjs/toolkit/query';
import type {
  AwaitingOwnerRank,
  InactiveOwnerRank
} from '@zerologementvacant/models';
import { Equivalence } from 'effect';
import { useState } from 'react';

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
import type { HousingOwner } from '~/models/Owner';
import {
  useUpdateHousingOwnersMutation,
  useUpdateOwnerMutation
} from '~/services/owner.service';

export interface ReviewOwnersSectionProps {
  housing: Housing | null;
}

/**
 * Reduced version of the housing-owners edition screen
 * (`HousingOwnersView`), used inside the review flow: a compact owners table
 * whose "Éditer" button opens the exact same side panel
 * (`HousingOwnerEditionAside`) so the user can change ranks and owner info.
 */
function ReviewOwnersSection(props: Readonly<ReviewOwnersSectionProps>) {
  const { housing } = props;
  const {
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

  return (
    <>
      <HousingOwnerTable
        title={`Propriétaires (${activeOwners.length})`}
        housing={housing}
        owners={activeOwners}
        isLoading={isLoading}
        columns={['name', 'rank', 'actions']}
        onEdit={onOwnerEdit}
      />

      <HousingOwnerEditionAside
        open={asideOpen}
        onClose={closeAside}
        housingOwner={selectedOwner}
        onSave={onSave}
      />
    </>
  );
}

export default ReviewOwnersSection;

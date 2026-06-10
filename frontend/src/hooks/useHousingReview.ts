import { useCallback, useState } from 'react';

import {
  getReviewState,
  markHousingVerified,
  startGroupReview,
  type ReviewState
} from '~/utils/housingReview';

/**
 * React access to the per-group housing review progress (localStorage-backed).
 */
export function useHousingReview(groupId: string) {
  const [state, setState] = useState<ReviewState>(() =>
    getReviewState(groupId)
  );

  const markVerified = useCallback(
    (housingId: string) => {
      setState(markHousingVerified(groupId, housingId));
    },
    [groupId]
  );

  const startReview = useCallback(() => {
    setState(startGroupReview(groupId));
  }, [groupId]);

  const isVerified = useCallback(
    (housingId: string) => state.verified.includes(housingId),
    [state.verified]
  );

  return {
    started: state.started,
    verifiedIds: state.verified,
    verifiedCount: state.verified.length,
    isVerified,
    markVerified,
    startReview
  };
}

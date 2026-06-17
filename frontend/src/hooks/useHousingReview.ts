import { useCallback, useEffect, useRef, useState } from 'react';

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

  // The review route reuses the same component instance across group ids
  // (same route pattern). Re-read the (group-scoped) state when the id changes,
  // otherwise a housing verified in group A would look verified in group B.
  const previousGroupId = useRef(groupId);
  useEffect(() => {
    if (previousGroupId.current !== groupId) {
      previousGroupId.current = groupId;
      setState(getReviewState(groupId));
    }
  }, [groupId]);

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

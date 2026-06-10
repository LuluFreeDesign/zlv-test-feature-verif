/**
 * Client-side persistence of the "housing review" progress, scoped per group.
 *
 * This is demo-only state (no backend): a housing's "verified" status lives in
 * localStorage keyed by group id, so the same housing can be verified in one
 * group and not in another, and progress survives a page reload.
 */

const STORAGE_PREFIX = 'zlv-demo:review:';

export interface ReviewState {
  /** Whether a review has been started for this group. */
  started: boolean;
  /** Ids of the housings that have been reviewed ("verified"). */
  verified: string[];
}

const EMPTY_STATE: ReviewState = { started: false, verified: [] };

function storageKey(groupId: string): string {
  return `${STORAGE_PREFIX}${groupId}`;
}

export function getReviewState(groupId: string): ReviewState {
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) {
      return { ...EMPTY_STATE };
    }
    const parsed = JSON.parse(raw) as Partial<ReviewState>;
    return {
      started: parsed.started ?? false,
      verified: Array.isArray(parsed.verified) ? parsed.verified : []
    };
  } catch {
    return { ...EMPTY_STATE };
  }
}

function setReviewState(groupId: string, state: ReviewState): void {
  localStorage.setItem(storageKey(groupId), JSON.stringify(state));
}

export function startGroupReview(groupId: string): ReviewState {
  const state = getReviewState(groupId);
  const next: ReviewState = { ...state, started: true };
  setReviewState(groupId, next);
  return next;
}

export function markHousingVerified(
  groupId: string,
  housingId: string
): ReviewState {
  const state = getReviewState(groupId);
  const verified = state.verified.includes(housingId)
    ? state.verified
    : [...state.verified, housingId];
  const next: ReviewState = { started: true, verified };
  setReviewState(groupId, next);
  return next;
}

export function isHousingVerified(groupId: string, housingId: string): boolean {
  return getReviewState(groupId).verified.includes(housingId);
}

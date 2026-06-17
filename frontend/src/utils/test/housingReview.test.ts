import { beforeEach, describe, expect, it } from 'vitest';

import {
  getReviewState,
  isHousingVerified,
  markHousingVerified,
  startGroupReview
} from '../housingReview';

describe('housingReview storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns a default empty state for an unknown group', () => {
    const state = getReviewState('group-1');

    expect(state).toStrictEqual({ started: false, verified: [] });
  });

  it('marks a group review as started', () => {
    startGroupReview('group-1');

    expect(getReviewState('group-1').started).toBe(true);
  });

  it('marks a housing as verified and persists it', () => {
    markHousingVerified('group-1', 'housing-a');

    expect(isHousingVerified('group-1', 'housing-a')).toBe(true);
    expect(getReviewState('group-1').verified).toContain('housing-a');
  });

  it('does not duplicate a housing already verified', () => {
    markHousingVerified('group-1', 'housing-a');
    markHousingVerified('group-1', 'housing-a');

    expect(getReviewState('group-1').verified).toStrictEqual(['housing-a']);
  });

  it('starting a review is implied when a housing is verified', () => {
    markHousingVerified('group-1', 'housing-a');

    expect(getReviewState('group-1').started).toBe(true);
  });

  it('isolates verification state between groups', () => {
    markHousingVerified('group-1', 'housing-a');

    expect(isHousingVerified('group-1', 'housing-a')).toBe(true);
    expect(isHousingVerified('group-2', 'housing-a')).toBe(false);
  });
});

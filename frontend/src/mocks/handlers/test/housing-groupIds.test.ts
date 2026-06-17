import { genHousingDTO } from '@zerologementvacant/models/fixtures';
import { beforeEach, describe, expect, it } from 'vitest';

import config from '~/utils/config';
import data from '../data';

describe('housing find handler — groupIds filter', () => {
  beforeEach(() => {
    data.reset();
  });

  it('returns only the housings belonging to the given group', async () => {
    const inGroup = genHousingDTO();
    const outOfGroup = genHousingDTO();
    data.housings.push(inGroup, outOfGroup);
    data.groupHousings.set('group-1', [{ id: inGroup.id }]);

    const response = await fetch(`${config.apiEndpoint}/housing?groupIds=group-1`);
    const body = await response.json();

    const ids: string[] = body.entities.map((housing: { id: string }) => housing.id);
    expect(ids).toContain(inGroup.id);
    expect(ids).not.toContain(outOfGroup.id);
  });

  it('counts only the housings belonging to the given group', async () => {
    const inGroup = genHousingDTO();
    const outOfGroup = genHousingDTO();
    data.housings.push(inGroup, outOfGroup);
    data.groupHousings.set('group-1', [{ id: inGroup.id }]);

    const response = await fetch(
      `${config.apiEndpoint}/housing/count?groupIds=group-1`
    );
    const body = await response.json();

    expect(body.housing).toBe(1);
  });
});

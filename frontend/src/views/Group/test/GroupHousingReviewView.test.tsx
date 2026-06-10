import type { Store } from '@reduxjs/toolkit';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  HousingStatus,
  UserRole,
  type GroupDTO,
  type HousingDTO,
  type UserDTO
} from '@zerologementvacant/models';
import {
  genEstablishmentDTO,
  genGroupDTO,
  genHousingDTO,
  genOwnerDTO,
  genUserDTO
} from '@zerologementvacant/models/fixtures';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';

import data from '~/mocks/handlers/data';
import { fromEstablishmentDTO } from '~/models/Establishment';
import { fromUserDTO } from '~/models/User';
import { genAuthUser } from '~/test/fixtures';
import configureTestStore from '~/utils/storeUtils';
import GroupHousingReviewView from '../GroupHousingReviewView';

interface RenderViewOptions {
  group: GroupDTO;
  housings: ReadonlyArray<HousingDTO>;
}

describe('GroupHousingReviewView', () => {
  const establishment = genEstablishmentDTO();
  const auth: UserDTO = genUserDTO(UserRole.USUAL, establishment);
  const user = userEvent.setup();

  beforeEach(() => {
    localStorage.clear();
  });

  function renderView(options: RenderViewOptions) {
    data.users.push(auth);
    data.establishments.push(establishment);
    data.groups.push(options.group);
    data.housings.push(...options.housings);

    options.housings.forEach((housing) => {
      const owner = genOwnerDTO();
      data.owners.push(owner);
      data.housingOwners.set(housing.id, [
        {
          id: owner.id,
          rank: 1,
          locprop: null,
          idprocpte: null,
          idprodroit: null,
          propertyRight: null,
          relativeLocation: 'same-commune',
          absoluteDistance: 50
        }
      ]);
    });
    data.groupHousings.set(
      options.group.id,
      options.housings.map((housing) => ({ id: housing.id }))
    );

    const store: Store = configureTestStore({
      auth: genAuthUser(fromUserDTO(auth), fromEstablishmentDTO(establishment))
    });

    const router = createMemoryRouter(
      [
        { path: '/parc-de-logements', element: 'Parc de logements' },
        { path: '/groupes/:id', element: 'Groupe' },
        {
          path: '/groupes/:id/passer-en-revue',
          element: <GroupHousingReviewView />
        }
      ],
      { initialEntries: [`/groupes/${options.group.id}/passer-en-revue`] }
    );

    render(
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    );

    return { router };
  }

  it('lists the housings to review with their main owner', async () => {
    const housing: HousingDTO = {
      ...genHousingDTO(),
      status: HousingStatus.NEVER_CONTACTED,
      subStatus: null
    };
    const group = genGroupDTO(auth, [housing]);

    renderView({ group, housings: [housing] });

    const list = await screen.findByRole('list', {
      name: 'Logements à vérifier'
    });
    expect(
      within(list).getByText(housing.rawAddress.join(', '))
    ).toBeInTheDocument();
  });

  it('marks the current housing as verified when saving', async () => {
    const housings: HousingDTO[] = [
      { ...genHousingDTO(), status: HousingStatus.NEVER_CONTACTED, subStatus: null },
      { ...genHousingDTO(), status: HousingStatus.NEVER_CONTACTED, subStatus: null }
    ];
    const group = genGroupDTO(auth, housings);

    renderView({ group, housings });

    const save = await screen.findByRole('button', {
      name: /Enregistrer et passer au suivant/
    });
    await user.click(save);

    expect(
      await screen.findByText(/1 logement vérifié sur 2/)
    ).toBeInTheDocument();
    expect(screen.getAllByText('Vérifié').length).toBeGreaterThan(0);
  });

  it('shows a field error when a required sub-status is missing', async () => {
    const housing: HousingDTO = {
      ...genHousingDTO(),
      status: HousingStatus.FIRST_CONTACT,
      subStatus: null
    };
    const group = genGroupDTO(auth, [housing]);

    renderView({ group, housings: [housing] });

    const save = await screen.findByRole('button', {
      name: /Enregistrer et passer au suivant/
    });
    await user.click(save);

    expect(
      await screen.findByText('Veuillez renseigner le sous-statut de suivi')
    ).toBeInTheDocument();
    expect(screen.queryByText('Vérifié')).not.toBeInTheDocument();
  });
});

import {
  type GroupDTO,
  type GroupPayloadDTO,
  OCCUPANCY_LABELS
} from '@zerologementvacant/models';
import { genGroupDTO } from '@zerologementvacant/models/fixtures';
import { Array, Record } from 'effect';
import { http, HttpResponse, RequestHandler } from 'msw';
import { constants } from 'node:http2';

import config from '../../utils/config';
import { decodeAuth } from './auth-helpers';
import data from './data';
import { filterByDTO } from './housing-handlers';

type GroupParams = {
  id: string;
};

export const groupHandlers: RequestHandler[] = [
  // List groups
  http.get<Record<string, never>, never, GroupDTO[]>(
    `${config.apiEndpoint}/groups`,
    () => {
      return HttpResponse.json(data.groups);
    }
  ),

  // Create a group
  http.post<Record<string, never>, GroupPayloadDTO, GroupDTO>(
    `${config.apiEndpoint}/groups`,
    async ({ request }) => {
      const payload = await request.json();
      const auth = decodeAuth(request);
      const creator =
        data.users.find((user) => user.id === auth?.user.id) ?? data.users[0];

      // Use the housings the user actually selected. `all` means "everything
      // matching the current filter except the listed ids" (deselection), so we
      // must apply the active filters — otherwise a group built from a commune
      // filter would wrongly include the whole parc.
      const ids = new Set(payload.housing?.ids ?? []);
      const all = payload.housing?.all ?? false;
      const filtered = payload.housing?.filters
        ? filterByDTO(payload.housing.filters)([...data.housings])
        : [...data.housings];
      const housings = all
        ? filtered.filter((housing) => !ids.has(housing.id))
        : data.housings.filter((housing) => ids.has(housing.id));

      const group: GroupDTO = {
        ...genGroupDTO(creator, housings),
        title: payload.title,
        description: payload.description
      };
      data.groups.push(group);
      data.groupHousings.set(
        group.id,
        housings.map((housing) => ({ id: housing.id }))
      );

      return HttpResponse.json(group, {
        status: constants.HTTP_STATUS_CREATED
      });
    }
  ),

  // Get a group
  http.get<GroupParams, never, GroupDTO | null>(
    `${config.apiEndpoint}/groups/:id`,
    ({ params }) => {
      const group = data.groups.find((group) => group.id === params.id);
      if (!group) {
        return HttpResponse.json(null, {
          status: constants.HTTP_STATUS_NOT_FOUND
        });
      }

      return HttpResponse.json(group);
    }
  ),

  // Update a group
  http.put<GroupParams, GroupPayloadDTO, GroupDTO>(
    `${config.apiEndpoint}/groups/:id`,
    async ({ params, request }) => {
      const group = data.groups.find((group) => group.id === params.id);
      if (!group) {
        return HttpResponse.json(null, {
          status: constants.HTTP_STATUS_NOT_FOUND
        });
      }

      const payload = await request.json();
      const updated: GroupDTO = {
        ...group,
        title: payload.title,
        description: payload.description
      };
      data.groups.splice(data.groups.indexOf(group), 1, updated);

      return HttpResponse.json(updated);
    }
  ),

  // Add housings to an existing group
  http.post<GroupParams, GroupPayloadDTO['housing']>(
    `${config.apiEndpoint}/groups/:id/housing`,
    async ({ params, request }) => {
      const group = data.groups.find((group) => group.id === params.id);
      if (!group) {
        return HttpResponse.json(
          {
            name: 'GroupMissingError',
            message: 'Group not found'
          },
          { status: constants.HTTP_STATUS_NOT_FOUND }
        );
      }

      // Honour the selection payload exactly like the create handler: `all`
      // means "everything matching the filters except the listed ids", while
      // `!all` means "only the listed ids". Ignoring it would wrongly merge the
      // whole parc into the group.
      const payload = await request.json();
      const ids = new Set(payload?.ids ?? []);
      const all = payload?.all ?? false;
      const filtered = payload?.filters
        ? filterByDTO(payload.filters)([...data.housings])
        : [...data.housings];
      const selectedHousings = all
        ? filtered.filter((housing) => !ids.has(housing.id))
        : data.housings.filter((housing) => ids.has(housing.id));

      const groupHousings = data.groupHousings.get(group.id) ?? [];
      data.groupHousings.set(group.id, [
        ...Array.dedupeWith(
          [...groupHousings, ...selectedHousings.map((housing) => ({ id: housing.id }))],
          (a, b) => a.id === b.id
        )
      ]);
      return HttpResponse.json(null, {
        status: constants.HTTP_STATUS_OK
      });
    }
  ),

  // Export a group's housings. The UI navigates to this URL (window.open), so
  // returning a file with an attachment disposition triggers a download instead
  // of a 404.
  http.get<GroupParams, never>(
    `${config.apiEndpoint}/groups/:id/export`,
    ({ params }) => {
      const group = data.groups.find((group) => group.id === params.id);
      if (!group) {
        return HttpResponse.json(null, {
          status: constants.HTTP_STATUS_NOT_FOUND
        });
      }

      const ids = new Set(
        (data.groupHousings.get(group.id) ?? []).map((housing) => housing.id)
      );
      const housings = data.housings.filter((housing) => ids.has(housing.id));

      const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
      const header = [
        'Adresse',
        'Localité',
        'Code INSEE',
        'Occupation',
        'Propriétaire principal'
      ];
      const lines = housings.map((housing) => {
        const mainHousingOwner =
          data.housingOwners
            .get(housing.id)
            ?.find((housingOwner) => housingOwner.rank === 1) ?? null;
        const mainOwner =
          data.owners.find((owner) => owner.id === mainHousingOwner?.id) ?? null;
        const [line1 = '', line2 = ''] = housing.rawAddress ?? [];
        return [
          line1,
          line2,
          housing.geoCode,
          OCCUPANCY_LABELS[housing.occupancy] ?? housing.occupancy,
          mainOwner?.fullName ?? ''
        ]
          .map(escape)
          .join(';');
      });
      // UTF-8 BOM so Excel opens accents correctly.
      const csv = '﻿' + [header.map(escape).join(';'), ...lines].join('\n');

      return new HttpResponse(csv, {
        status: constants.HTTP_STATUS_OK,
        headers: {
          'Content-Type': 'text/csv;charset=utf-8',
          'Content-Disposition': `attachment; filename="export-groupe-${group.id}.csv"`
        }
      });
    }
  ),

  // Delete a group
  http.delete<GroupParams, never, never>(
    `${config.apiEndpoint}/groups/:id`,
    ({ params }) => {
      const group = data.groups.find((group) => group.id === params.id);
      if (!group) {
        throw new HttpResponse(null, {
          status: constants.HTTP_STATUS_NOT_FOUND
        });
      }

      const hasCampaign = data.campaigns.some(
        (campaign) => campaign.groupId === group.id
      );
      if (hasCampaign) {
        group.archivedAt = new Date().toJSON();
      } else {
        data.groups = data.groups.filter((group) => group.id !== params.id);
        data.groupHousings.delete(params.id);
      }

      return new HttpResponse(null, {
        status: constants.HTTP_STATUS_NO_CONTENT
      });
    }
  )
];

import type { GroupDTO, GroupPayloadDTO } from '@zerologementvacant/models';
import { genGroupDTO } from '@zerologementvacant/models/fixtures';
import { Array, Record } from 'effect';
import { http, HttpResponse, RequestHandler } from 'msw';
import { constants } from 'node:http2';

import config from '../../utils/config';
import { decodeAuth } from './auth-helpers';
import data from './data';

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
      // matching the current filter except the listed ids" (deselection).
      const ids = new Set(payload.housing?.ids ?? []);
      const all = payload.housing?.all ?? false;
      const housings = all
        ? data.housings.filter((housing) => !ids.has(housing.id))
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
    async ({ params }) => {
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

      const groupHousings = data.groupHousings.get(group.id) ?? [];
      data.groupHousings.set(group.id, [
        ...Array.dedupeWith(
          [...groupHousings, ...data.housings],
          (a, b) => a.id === b.id
        )
      ]);
      return HttpResponse.json(null, {
        status: constants.HTTP_STATUS_OK
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

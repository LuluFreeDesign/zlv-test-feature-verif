import { faker } from '@faker-js/faker/locale/fr';
import type { EventDTO, EventType } from '@zerologementvacant/models';
import { http, HttpResponse, RequestHandler } from 'msw';
import { constants } from 'node:http2';
import config from '../../utils/config';
import { decodeAuth } from './auth-helpers';
import data from './data';

interface VerificationEventPayload {
  group: { id: string; title: string } | null;
  modifications: string[];
}

export const eventHandlers: RequestHandler[] = [
  http.get<{ id: string }, never, EventDTO<EventType>[]>(
    `${config.apiEndpoint}/housing/:id/events`,
    ({ params }) => {
      const housing = data.housings.find((housing) => housing.id === params.id);
      if (!housing) {
        return HttpResponse.json(null, {
          status: constants.HTTP_STATUS_NOT_FOUND
        });
      }

      const events = data.housingEvents.get(housing.id) ?? [];
      return HttpResponse.json(events);
    }
  ),

  // Create a "housing:verified" event when a housing is reviewed.
  http.post<
    { id: string },
    VerificationEventPayload,
    EventDTO<'housing:verified'> | null
  >(`${config.apiEndpoint}/housing/:id/events`, async ({ params, request }) => {
    const housing = data.housings.find((housing) => housing.id === params.id);
    if (!housing) {
      return HttpResponse.json(null, {
        status: constants.HTTP_STATUS_NOT_FOUND
      });
    }

    const auth = decodeAuth(request);
    const creator =
      data.users.find((user) => user.id === auth?.user.id) ?? data.users[0];
    const payload = await request.json();

    const event: EventDTO<'housing:verified'> = {
      id: faker.string.uuid(),
      type: 'housing:verified',
      nextOld: null,
      nextNew: { group: payload.group, modifications: payload.modifications },
      createdAt: new Date().toJSON(),
      createdBy: creator.id,
      creator
    };
    data.housingEvents.set(housing.id, [
      ...(data.housingEvents.get(housing.id) ?? []),
      event
    ]);

    return HttpResponse.json(event, {
      status: constants.HTTP_STATUS_CREATED
    });
  })
];

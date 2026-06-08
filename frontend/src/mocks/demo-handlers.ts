import type { EstablishmentDTO, UserDTO } from '@zerologementvacant/models';
import jwt from 'jsonwebtoken';
import { http, HttpResponse, type RequestHandler } from 'msw';

import config from '~/utils/config';
import data from './handlers/data';

interface AuthPayload {
  email: string;
  password: string;
  establishmentId?: string;
}

interface Auth {
  user: UserDTO;
  accessToken: string;
  establishment: EstablishmentDTO;
}

/**
 * Build a demo access token. It is a real (signature-less) JWT whose payload is
 * `{ userId, establishmentId, role }`, which is what the mock layer's
 * `decodeAuth` reads (see `handlers/auth-helpers.ts`). Without this, flows that
 * decode the token — e.g. creating a campaign from a group — would crash.
 */
export function signDemoToken(user: UserDTO, establishment: EstablishmentDTO): string {
  return jwt.sign({
    userId: user.id,
    establishmentId: establishment.id,
    role: user.role
  });
}

/**
 * Demo-only handlers. Registered BEFORE the default handlers so they take
 * precedence (MSW is first-match-wins).
 *
 * Overrides login so that ANY credentials work: the entered email is matched
 * against the seeded users, falling back to the demo current user. A valid JWT
 * is always returned.
 */
export const demoHandlers: RequestHandler[] = [
  http.post<Record<string, never>, AuthPayload, Auth | null>(
    `${config.apiEndpoint}/authenticate`,
    async ({ request }) => {
      const payload = await request.json();
      const user =
        data.users.find((candidate) => candidate.email === payload.email) ??
        data.users[0];
      if (!user) {
        return HttpResponse.json(null, { status: 401 });
      }

      const establishment =
        data.establishments.find(
          (candidate) => candidate.id === user.establishmentId
        ) ?? data.establishments[0];

      return HttpResponse.json({
        user,
        accessToken: signDemoToken(user, establishment),
        establishment
      });
    }
  )
];

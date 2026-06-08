import { fromEstablishmentDTO } from '~/models/Establishment';

import { worker } from './browser';
import { signDemoToken } from './demo-handlers';
import { seed } from './seed';

const AUTH_KEY = 'authUser';

/**
 * Boot the demo environment:
 *  1. Seed the in-memory store with fake data.
 *  2. Auto-login: write a valid `authUser` to localStorage so the Redux store
 *     initialises as authenticated (testers land directly in the app).
 *  3. Start the Mock Service Worker so every API call is intercepted.
 *
 * MUST be awaited BEFORE the Redux store / app are imported and rendered, so
 * that the store reads the `authUser` we just wrote and no request is fired
 * before the worker is ready.
 */
export async function startDemo(): Promise<void> {
  const { currentUser, establishment } = seed();

  const authUser = {
    user: currentUser,
    accessToken: signDemoToken(currentUser, establishment),
    establishment: fromEstablishmentDTO(establishment),
    authorizedEstablishments: [fromEstablishmentDTO(establishment)]
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(authUser));

  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: `${import.meta.env.BASE_URL}mockServiceWorker.js`
    }
  });
}

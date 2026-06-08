import { startReactDsfr } from '@codegouvfr/react-dsfr/spa';
import { Link } from 'react-router';

import sentry from './utils/sentry';

sentry.init();

startReactDsfr({
  defaultColorScheme: 'light',
  Link
});

declare module '@codegouvfr/react-dsfr/spa' {
  interface RegisterLink {
    Link: typeof Link;
  }
}

/**
 * Application bootstrap.
 *
 * In demo mode (`VITE_DEMO_MODE=true`) we first start Mock Service Worker, seed
 * fake data and auto-login — THEN dynamically import and render the app, so the
 * Redux store initialises against the seeded/authenticated state.
 *
 * The `./mocks/*` modules are imported dynamically and only under the flag, so
 * they are code-split out of a normal (non-demo) production build.
 */
async function bootstrap(): Promise<void> {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    const { startDemo } = await import('./mocks/start');
    await startDemo();
  }

  const { renderApp } = await import('./render-app');
  renderApp();
}

void bootstrap();

import { setupWorker } from 'msw/browser';

import { demoHandlers } from './demo-handlers';
import { handlers } from './handlers';

/**
 * Browser-side Mock Service Worker. Demo handlers come first so they win over
 * the default ones (MSW resolves the first matching handler).
 *
 * This module is only ever imported in demo mode (dynamically, from the
 * bootstrap in `index.tsx`), so it is code-split out of production builds.
 */
export const worker = setupWorker(...demoHandlers, ...handlers);

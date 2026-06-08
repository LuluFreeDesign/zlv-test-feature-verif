import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { MapProvider } from 'react-map-gl/maplibre';
import { Provider as StoreProvider } from 'react-redux';

import App from './App';
import Notification from './components/Notification/Notification';
import { store } from './store/store';
import ThemeProvider from './theme';
import config from './utils/config';
import sentry from './utils/sentry';

/**
 * Mount the React application. Imported dynamically from `index.tsx` AFTER the
 * optional demo bootstrap, so the Redux store (initialised on import of
 * `./store/store`) sees the auto-login `authUser` written during the bootstrap.
 */
export function renderApp(): void {
  if (config.posthog.enabled) {
    posthog.init(config.posthog.apiKey, {
      api_host: 'https://eu.i.posthog.com',
      person_profiles: 'identified_only'
    });
  }

  const container = document.getElementById('root');
  const root = ReactDOM.createRoot(container!);

  root.render(
    <StrictMode>
      <sentry.ErrorBoundary
        fallback={({ error, resetError }) => (
          <div
            style={{
              padding: '20px',
              textAlign: 'center',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              margin: '20px'
            }}
          >
            <h2>Une erreur s&apos;est produite</h2>
            <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
              <summary>Détails de l&apos;erreur</summary>
              {error?.toString()}
            </details>
            <button
              onClick={resetError}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Réessayer
            </button>
          </div>
        )}
        beforeCapture={(scope) => {
          scope.setTag('errorBoundary', 'root');
        }}
      >
        <ThemeProvider>
          <MapProvider>
            <PostHogProvider client={posthog}>
              <StoreProvider store={store}>
                <Notification />
                <App />
              </StoreProvider>
            </PostHogProvider>
          </MapProvider>
        </ThemeProvider>
      </sentry.ErrorBoundary>
    </StrictMode>
  );
}

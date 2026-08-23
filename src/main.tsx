import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'
import { ErrorFallback } from './components/errors/ErrorFallback'

const replayEnabled = import.meta.env.VITE_SENTRY_REPLAY_ENABLED === "true";

const integrations = [
  Sentry.browserTracingIntegration(),
];

if (replayEnabled) {
  integrations.push(
    Sentry.replayIntegration()
  );
}

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
  release: import.meta.env.VITE_SENTRY_RELEASE,
  integrations,
  // Tracing
  tracesSampleRate: import.meta.env.PROD ? (parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE) || 0.1) : 1.0,
  // Session Replay
  ...(replayEnabled && {
    replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 0,
    replaysOnErrorSampleRate: 1.0,
  })
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={({ error, resetError }) => <ErrorFallback error={error as Error} resetError={resetError} />}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)

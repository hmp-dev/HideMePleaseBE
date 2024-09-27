import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Ensure to call this before importing any other modules!
Sentry.init({
	dsn: 'https://7272387016df3cbe7ea7ad4c351b6fe2@o4508022969335808.ingest.de.sentry.io/4508022972153936',
	integrations: [
		// Add our Profiling integration
		nodeProfilingIntegration(),
	],

	// Add Tracing by setting tracesSampleRate
	// We recommend adjusting this value in production
	tracesSampleRate: 1.0,

	// Set sampling rate for profiling
	// This is relative to tracesSampleRate
	profilesSampleRate: 1.0,
});

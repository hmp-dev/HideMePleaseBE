import * as Sentry from '@sentry/nestjs';

// Ensure to call this before importing any other modules!
Sentry.init({
	dsn: 'https://7272387016df3cbe7ea7ad4c351b6fe2@o4508022969335808.ingest.de.sentry.io/4508022972153936',

	// Add Tracing by setting tracesSampleRate
	// We recommend adjusting this value in production
	tracesSampleRate: 1.0,
});

/**
 * Global safety nets. Without these, a single unhandled promise rejection from
 * a third-party SDK (ethers RPC timeouts have been the worst offender) can
 * accumulate listeners/objects in V8 and eventually crash the process with OOM.
 * We log to stderr and forward to Sentry so we can spot regressions early.
 */
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
	const err = reason instanceof Error ? reason : new Error(String(reason));
	Sentry.captureException(err, {
		tags: { source: 'unhandledRejection' },
		extra: { promise: String(promise) },
	});
	// eslint-disable-next-line no-console
	console.error('[unhandledRejection]', err.message);
});

process.on('uncaughtException', (err: Error) => {
	Sentry.captureException(err, { tags: { source: 'uncaughtException' } });
	// eslint-disable-next-line no-console
	console.error('[uncaughtException]', err.message, err.stack);
	// Flush Sentry events, then let PM2 restart the process cleanly.
	void Sentry.close(2000).finally(() => process.exit(1));
});

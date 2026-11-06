/**
 * Elora Cloud Functions entry point.
 *
 * Functions are grouped by domain:
 * - admin/          access checks for the in-app admin control centre
 * - news/           RSS/API aggregation, categorisation, de-duplication (Phase 4)
 * - notifications/  FCM push notifications (Phase 4)
 * - scheduled/      clean-up and backup jobs (Phase 7)
 */
import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2';

initializeApp();

setGlobalOptions({
  region: process.env.FUNCTION_REGION ?? 'asia-south1',
  maxInstances: 5,
});

export { validateAdminAccess } from './admin/validate-admin-access.js';

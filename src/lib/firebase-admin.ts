import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Firebase projectId (sama dengan firebase-applet-config.json). Boleh override dengan env FIREBASE_PROJECT_ID.
const projectId = process.env.FIREBASE_PROJECT_ID || 'laughing-upgrade-41ttq';

if (!getApps().length) {
  initializeApp({ projectId });
}

export const adminAuth = getAuth();

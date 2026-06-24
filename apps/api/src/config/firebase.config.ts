import * as admin from "firebase-admin";

export const initializeFirebase = (): admin.app.App => {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountEnv) {
    try {
      const serviceAccount = JSON.parse(serviceAccountEnv);
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON. Initializing with default credentials.");
    }
  }

  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
};

import config from './env.js';
import fs from 'fs';
import path from 'path';

export const verifyFirebaseConfig = () => {
  const results = [];

  const usingEnvCreds = Boolean(
    config.FIREBASE_PROJECT_ID && config.FIREBASE_PRIVATE_KEY && config.FIREBASE_CLIENT_EMAIL
  );

  results.push({ key: 'FIREBASE_DATABASE_URL', ok: Boolean(config.FIREBASE_DATABASE_URL), value: config.FIREBASE_DATABASE_URL || '' });

  if (usingEnvCreds) {
    results.push({ key: 'FIREBASE_PROJECT_ID', ok: true, value: config.FIREBASE_PROJECT_ID });
    results.push({ key: 'FIREBASE_CLIENT_EMAIL', ok: true, value: '[present]' });
    results.push({ key: 'FIREBASE_PRIVATE_KEY', ok: true, value: '[present]' });
    results.push({ key: 'MODE', ok: true, value: 'env-vars' });
  } else if (config.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const resolvedPath = path.resolve(process.cwd(), config.FIREBASE_SERVICE_ACCOUNT_PATH);
    const exists = fs.existsSync(resolvedPath);
    results.push({ key: 'FIREBASE_SERVICE_ACCOUNT_PATH', ok: exists, value: resolvedPath });
    results.push({ key: 'MODE', ok: exists, value: 'service-account-file' });
  } else {
    results.push({ key: 'MODE', ok: false, value: 'not-configured' });
  }

  // Summary
  const allOk = results.every(r => r.ok);
  return { allOk, results };
};

export default verifyFirebaseConfig;

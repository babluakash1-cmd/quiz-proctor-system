const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let credential;

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    credential = admin.credential.cert(parsed);
  } catch (err) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON from environment variable:', err.message);
  }
}

if (!credential) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? path.resolve(__dirname, '../../', process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : path.resolve(__dirname, '../../serviceAccountKey.json');

  if (fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = require(serviceAccountPath);
      credential = admin.credential.cert(serviceAccount);
    } catch (err) {
      console.error(`Error loading service account file from ${serviceAccountPath}:`, err.message);
    }
  } else {
    console.warn(`[WARNING] Firebase Service Account key file not found at: ${serviceAccountPath}`);
    console.warn('Please download serviceAccountKey.json from Firebase Console -> Project Settings -> Service accounts and place it in backend/serviceAccountKey.json');
  }
}

const databaseURL = process.env.FIREBASE_DATABASE_URL;

if (!databaseURL) {
  console.warn('[WARNING] FIREBASE_DATABASE_URL is not defined in .env! Firebase Realtime Database calls will fail.');
}

if (credential && databaseURL) {
  admin.initializeApp({
    credential,
    databaseURL
  });
} else if (databaseURL) {
  // Attempt default credential initialization (e.g. Google Cloud Run or GCE)
  try {
    admin.initializeApp({
      databaseURL
    });
  } catch (err) {
    console.error('Firebase initialization fallback failed:', err.message);
  }
}

const rtdb = admin.apps.length > 0 ? admin.database() : null;

module.exports = { admin, rtdb };

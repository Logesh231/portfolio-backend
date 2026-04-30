const admin = require('firebase-admin');

// Initialize Firebase Admin SDK using service account
// The service account JSON is stored as environment variable on Render
// Locally it reads from the file

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // ✅ On Render — stored as environment variable (JSON string)
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
    // ✅ Local development — reads from file
    serviceAccount = require('./serviceAccountKey.json');
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

module.exports = admin;
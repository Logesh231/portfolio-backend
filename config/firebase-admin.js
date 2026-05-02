const admin = require('firebase-admin');

// ✅ On Render — reads from environment variable FIREBASE_SERVICE_ACCOUNT
// ✅ Local — also reads from environment variable (set in .env file)
// ❌ Never reads from a local JSON file — that's what caused the crash

if (!admin.apps.length) {
    try {
        console.log("ENV CHECK:", process.env.FIREBASE_SERVICE_ACCOUNT ? "SET" : "NOT SET");

        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        console.log('✅ Firebase Admin initialized');
    } catch (err) {
        console.error('❌ Firebase Admin init error:', err.message);
        console.error('Make sure FIREBASE_SERVICE_ACCOUNT env variable is set correctly');
        process.exit(1);
    }
}

module.exports = admin;


// const admin = require('firebase-admin');

// // Initialize Firebase Admin SDK using service account
// // The service account JSON is stored as environment variable on Render
// // Locally it reads from the file

// let serviceAccount;

// if (process.env.FIREBASE_SERVICE_ACCOUNT) {
//     // ✅ On Render — stored as environment variable (JSON string)
//     serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
// } else {
//     // ✅ Local development — reads from file
//     serviceAccount = require('./serviceAccountKey.json');
// }

// if (!admin.apps.length) {
//     admin.initializeApp({
//         credential: admin.credential.cert(serviceAccount)
//     });
// }

// module.exports = admin;
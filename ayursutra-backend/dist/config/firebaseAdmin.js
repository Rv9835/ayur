"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFirebaseAdminConfigured = exports.adminAuth = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
// For your project: reference-lens-436617-i5
const projectId = process.env.FIREBASE_PROJECT_ID || "reference-lens-436617-i5";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
// Check if Firebase Admin SDK is properly configured
const isFirebaseConfigured = projectId && clientEmail && privateKey;
if (!firebase_admin_1.default.apps.length) {
    if (isFirebaseConfigured) {
        try {
            firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
            console.log("✅ Firebase Admin SDK initialized successfully");
        }
        catch (error) {
            console.error("❌ Firebase Admin SDK initialization failed:", error);
        }
    }
    else {
        console.warn("⚠️ Firebase Admin SDK not configured. Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env");
        // Initialize with default app for development
        firebase_admin_1.default.initializeApp({
            projectId: projectId,
        });
    }
}
exports.adminAuth = firebase_admin_1.default.auth();
// Export a function to check if Firebase is properly configured
const isFirebaseAdminConfigured = () => isFirebaseConfigured;
exports.isFirebaseAdminConfigured = isFirebaseAdminConfigured;
//# sourceMappingURL=firebaseAdmin.js.map
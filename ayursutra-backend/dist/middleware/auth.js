"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyFirebaseUid = verifyFirebaseUid;
exports.signAppJwt = signAppJwt;
exports.verifyAppJwt = verifyAppJwt;
exports.requireRoles = requireRoles;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const firebaseAdmin_1 = require("../config/firebaseAdmin");
async function verifyFirebaseUid(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer "))
            return res.status(401).json({ message: "Missing token" });
        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Invalid token format" });
        }
        // Check if Firebase Admin is properly configured
        if (!(0, firebaseAdmin_1.isFirebaseAdminConfigured)()) {
            console.warn("Firebase Admin not configured, using demo mode");
            // For development, accept any token and create a demo user
            req.user = { uid: "demo-user-123" };
            return next();
        }
        const decoded = await firebaseAdmin_1.adminAuth.verifyIdToken(token);
        req.user = { uid: decoded.uid };
        next();
    }
    catch (e) {
        console.error("Firebase token verification failed:", e);
        return res.status(401).json({ message: "Invalid Firebase token" });
    }
}
function signAppJwt(uid, role) {
    const secret = process.env.JWT_SECRET || "ayursutra-super-secret-jwt-key-2024";
    return jsonwebtoken_1.default.sign({ uid, role }, secret, { expiresIn: "7d" });
}
function verifyAppJwt(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer "))
            return res.status(401).json({ message: "Missing token" });
        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Invalid token format" });
        }
        // Check if Firebase Admin is not configured - use demo mode
        if (!(0, firebaseAdmin_1.isFirebaseAdminConfigured)()) {
            console.warn("Firebase Admin not configured, using demo mode for JWT verification");
            // Dev mode handling:
            // 1) Raw UID token (no dots)
            if (token.length > 20 && !token.includes(".")) {
                req.user = { uid: token, role: "patient" };
                console.log("Firebase UID mode - assigned user:", req.user);
                return next();
            }
            // 2) Firebase-style JWT: decode without verifying to extract uid
            if (token.includes(".")) {
                try {
                    const decoded = jsonwebtoken_1.default.decode(token) || {};
                    const decodedUid = decoded.uid || decoded.user_id || decoded.sub;
                    const decodedRole = decoded.role || "patient";
                    if (decodedUid) {
                        req.user = { uid: decodedUid, role: decodedRole };
                        console.log("Decoded JWT (demo) - assigned user:", req.user);
                        return next();
                    }
                }
                catch (e) {
                    console.warn("JWT decode failed in demo mode:", e);
                }
            }
        }
        const secret = process.env.JWT_SECRET || "ayursutra-super-secret-jwt-key-2024";
        const payload = jsonwebtoken_1.default.verify(token, secret);
        if (!payload.uid || !payload.role) {
            return res.status(401).json({ message: "Invalid token payload" });
        }
        req.user = { uid: payload.uid, role: payload.role };
        next();
    }
    catch (e) {
        // If JWT verification fails and Firebase Admin is not configured,
        // try to use the token as a Firebase UID
        if (!(0, firebaseAdmin_1.isFirebaseAdminConfigured)()) {
            console.warn("JWT verification failed, trying as Firebase UID:", e);
            const token = req.headers.authorization?.split(" ")[1];
            if (token && token.length > 20 && !token.includes(".")) {
                req.user = { uid: token, role: "patient" };
                console.log("JWT verification failed - fallback mode - assigned user:", req.user);
                return next();
            }
        }
        return res.status(401).json({ message: "Invalid token" });
    }
}
function requireRoles(roles) {
    return (req, res, next) => {
        const role = req.user?.role;
        console.log("requireRoles check:", {
            userRole: role,
            allowedRoles: roles,
            user: req.user,
        });
        if (!role || !roles.includes(role))
            return res.status(403).json({ message: "Forbidden" });
        next();
    };
}
//# sourceMappingURL=auth.js.map
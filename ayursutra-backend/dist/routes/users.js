"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const events_1 = require("../realtime/events");
const router = (0, express_1.Router)();
router.use(auth_1.verifyAppJwt);
// Get current authenticated user by UID
router.get("/me", (0, auth_1.requireRoles)(["admin", "doctor", "patient"]), async (req, res) => {
    try {
        const { uid } = req.user;
        let user = await User_1.User.findOne({ uid }).select("-__v");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch current user" });
    }
});
// Get users with optional role filtering
router.get("/", (0, auth_1.requireRoles)(["admin", "doctor", "patient"]), async (req, res) => {
    try {
        const { role } = req.query;
        if (!req.user) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const { uid, role: userRole } = req.user;
        let query = {};
        // If role filter is provided, add it to the query
        if (role) {
            query = { role };
        }
        // Patients can only see doctors, doctors can see patients and other doctors, admins can see all
        if (userRole === "patient") {
            query = { role: "doctor" };
        }
        else if (userRole === "doctor") {
            query = { role: { $in: ["patient", "doctor"] } };
        }
        const users = await User_1.User.find(query).select("-__v");
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});
// Get user by ID
router.get("/:id", (0, auth_1.requireRoles)(["admin", "doctor", "patient"]), async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const { uid, role } = req.user;
        // Users can only view their own profile unless they're admin
        if (role !== "admin" && id !== uid) {
            return res.status(403).json({ error: "Access denied" });
        }
        const user = await User_1.User.findById(id).select("-__v");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch user" });
    }
});
// Create user (admin only)
router.post("/", (0, auth_1.requireRoles)(["admin"]), async (req, res) => {
    try {
        const user = await User_1.User.create(req.body);
        res.status(201).json(user);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to create user" });
    }
});
// Update user by Mongo _id; non-admins can only update their own record
router.put("/:id", (0, auth_1.requireRoles)(["admin", "doctor", "patient"]), async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const { uid, role } = req.user;
        // If not admin, ensure the target record belongs to the requester
        if (role !== "admin") {
            const target = await User_1.User.findById(id);
            if (!target)
                return res.status(404).json({ error: "User not found" });
            if (String(target.uid) !== String(uid)) {
                return res.status(403).json({ error: "Access denied" });
            }
        }
        // Prevent admins from changing their own role (promotion/demotion)
        if (role === "admin") {
            const self = await User_1.User.findOne({ uid }).select("_id role");
            if (self && String(self._id) === String(id)) {
                if (typeof req.body.role === "string") {
                    return res
                        .status(403)
                        .json({ error: "Admins cannot change their own role" });
                }
            }
        }
        const user = await User_1.User.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        }).select("-__v");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to update user" });
    }
});
// Update current user's profile (convenience)
router.put("/me", (0, auth_1.requireRoles)(["admin", "doctor", "patient"]), async (req, res) => {
    try {
        const { uid, role } = req.user;
        // Whitelist updatable fields
        const updates = {};
        if (Object.prototype.hasOwnProperty.call(req.body, "name")) {
            if (typeof req.body.name === "string" && req.body.name.trim() !== "") {
                updates.name = req.body.name.trim();
            }
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "email")) {
            if (typeof req.body.email === "string" &&
                req.body.email.trim() !== "") {
                updates.email = req.body.email.trim();
            }
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "specialty")) {
            updates.specialty = req.body.specialty ?? "";
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "avatar")) {
            updates.avatar = req.body.avatar ?? "";
        }
        // Prevent role/isApproved tampering via this endpoint for non-admins
        if (role !== "admin") {
            delete updates.role;
            delete updates.isApproved;
        }
        // If no valid updates provided, just return current user
        if (Object.keys(updates).length === 0) {
            const me = await User_1.User.findOne({ uid }).select("-__v");
            if (!me)
                return res.status(404).json({ error: "User not found" });
            return res.json(me);
        }
        const user = await User_1.User.findOneAndUpdate({ uid }, updates, {
            new: true,
            upsert: true,
            runValidators: false,
            setDefaultsOnInsert: true,
        }).select("-__v");
        if (!user)
            return res.status(404).json({ error: "User not found" });
        return res.json(user);
    }
    catch (error) {
        console.error("Update current user failed:", error);
        res.status(500).json({ error: "Failed to update current user" });
    }
});
// Approve user (admin only)
router.patch("/:id/approve", (0, auth_1.requireRoles)(["admin"]), async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User_1.User.findByIdAndUpdate(id, { isApproved: true }, { new: true }).select("-__v");
        if (!user)
            return res.status(404).json({ error: "User not found" });
        (0, events_1.emitRealtime)({
            type: "user.approved",
            payload: {
                id: String(user._id),
                role: user.role,
                name: user.name,
            },
        });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to approve user" });
    }
});
// Delete user (admin only)
router.delete("/:id", (0, auth_1.requireRoles)(["admin"]), async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User_1.User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({ message: "User deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to delete user" });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map
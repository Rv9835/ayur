"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.verifyAppJwt);
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
// Update user
router.put("/:id", (0, auth_1.requireRoles)(["admin", "doctor", "patient"]), async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const { uid, role } = req.user;
        // Users can only update their own profile unless they're admin
        if (role !== "admin" && id !== uid) {
            return res.status(403).json({ error: "Access denied" });
        }
        const user = await User_1.User.findByIdAndUpdate(id, req.body, {
            new: true,
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
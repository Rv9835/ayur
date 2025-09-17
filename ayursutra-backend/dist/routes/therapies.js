"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Therapy_1 = require("../models/Therapy");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.verifyAppJwt);
// Get all therapies
router.get("/", (0, auth_1.requireRoles)(["admin", "doctor", "patient"]), async (req, res) => {
    try {
        const therapies = await Therapy_1.Therapy.find().select("-__v");
        res.json(therapies);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch therapies" });
    }
});
// Get therapy by ID
router.get("/:id", (0, auth_1.requireRoles)(["admin", "doctor", "patient"]), async (req, res) => {
    try {
        const { id } = req.params;
        const therapy = await Therapy_1.Therapy.findById(id).select("-__v");
        if (!therapy) {
            return res.status(404).json({ error: "Therapy not found" });
        }
        res.json(therapy);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch therapy" });
    }
});
// Create therapy (admin only)
router.post("/", (0, auth_1.requireRoles)(["admin"]), async (req, res) => {
    try {
        const { name, description, durationMinutes } = req.body;
        // Validate required fields
        if (!name || !durationMinutes) {
            return res.status(400).json({ error: "Name and duration are required" });
        }
        const therapy = new Therapy_1.Therapy({
            name,
            description,
            durationMinutes: parseInt(durationMinutes),
        });
        const created = await therapy.save();
        res.status(201).json(created);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to create therapy" });
    }
});
// Update therapy (admin only)
router.put("/:id", (0, auth_1.requireRoles)(["admin"]), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // Convert duration to number if provided
        if (updateData.durationMinutes) {
            updateData.durationMinutes = parseInt(updateData.durationMinutes);
        }
        const therapy = await Therapy_1.Therapy.findByIdAndUpdate(id, updateData, {
            new: true,
        }).select("-__v");
        if (!therapy) {
            return res.status(404).json({ error: "Therapy not found" });
        }
        res.json(therapy);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to update therapy" });
    }
});
// Delete therapy (admin only)
router.delete("/:id", (0, auth_1.requireRoles)(["admin"]), async (req, res) => {
    try {
        const { id } = req.params;
        const therapy = await Therapy_1.Therapy.findByIdAndDelete(id);
        if (!therapy) {
            return res.status(404).json({ error: "Therapy not found" });
        }
        res.json({ message: "Therapy deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to delete therapy" });
    }
});
exports.default = router;
//# sourceMappingURL=therapies.js.map
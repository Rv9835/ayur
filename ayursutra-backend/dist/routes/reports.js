"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Appointment_1 = require("../models/Appointment");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.verifyAppJwt, (0, auth_1.requireRoles)(["admin"]));
router.get("/revenue", async (_req, res) => {
    const count = await Appointment_1.Appointment.countDocuments({ status: "completed" });
    const revenue = count * 100; // dummy
    res.json({ completed: count, revenue });
});
exports.default = router;
//# sourceMappingURL=reports.js.map
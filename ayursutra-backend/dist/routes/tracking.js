"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Appointment_1 = require("../models/Appointment");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.verifyAppJwt);
router.post("/:id/start", (0, auth_1.requireRoles)(["doctor"]), async (req, res) => {
    const appt = await Appointment_1.Appointment.findByIdAndUpdate(req.params.id, { status: "in_progress" }, { new: true });
    res.json(appt);
});
router.post("/:id/end", (0, auth_1.requireRoles)(["doctor"]), async (req, res) => {
    const appt = await Appointment_1.Appointment.findByIdAndUpdate(req.params.id, { status: "completed" }, { new: true });
    res.json(appt);
});
exports.default = router;
//# sourceMappingURL=tracking.js.map
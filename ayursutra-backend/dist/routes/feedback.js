"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Feedback_1 = require("../models/Feedback");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.verifyAppJwt);
router.post("/", async (req, res) => {
    const created = await Feedback_1.Feedback.create(req.body);
    res.json(created);
});
router.get("/", async (_req, res) => {
    const list = await Feedback_1.Feedback.find().populate("by aboutAppointment");
    res.json(list);
});
exports.default = router;
//# sourceMappingURL=feedback.js.map
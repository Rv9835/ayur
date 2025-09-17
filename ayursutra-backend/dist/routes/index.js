"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_1 = __importDefault(require("./users"));
const schedule_1 = __importDefault(require("./schedule"));
const tracking_1 = __importDefault(require("./tracking"));
const feedback_1 = __importDefault(require("./feedback"));
const reports_1 = __importDefault(require("./reports"));
const therapies_1 = __importDefault(require("./therapies"));
const progress_1 = __importDefault(require("./progress"));
const public_1 = __importDefault(require("./public"));
const notifications_1 = __importDefault(require("./notifications"));
const messages_1 = __importDefault(require("./messages"));
const router = (0, express_1.Router)();
router.use("/users", users_1.default);
router.use("/schedule", schedule_1.default);
router.use("/tracking", tracking_1.default);
router.use("/feedback", feedback_1.default);
router.use("/reports", reports_1.default);
router.use("/notifications", notifications_1.default);
router.use("/messages", messages_1.default);
router.use("/therapies", therapies_1.default);
router.use("/progress", progress_1.default);
router.use("/auth", public_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map
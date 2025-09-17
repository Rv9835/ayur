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
const events_1 = require("../realtime/events");
const router = (0, express_1.Router)();
router.use("/users", users_1.default);
router.use("/schedule", schedule_1.default);
router.use("/tracking", tracking_1.default);
router.use("/feedback", feedback_1.default);
router.use("/reports", reports_1.default);
router.use("/notifications", notifications_1.default);
router.use("/messages", messages_1.default);
// Server-Sent Events stream for realtime updates
router.get("/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    const send = (event) => {
        res.write(`event: ${event.type}\n`);
        res.write(`data: ${JSON.stringify(event)}\n\n`);
    };
    const onEvent = (event) => send(event);
    events_1.realtimeBus.on("event", onEvent);
    // keepalive
    const keepalive = setInterval(() => {
        res.write(": ping\n\n");
    }, 20000);
    req.on("close", () => {
        clearInterval(keepalive);
        events_1.realtimeBus.off("event", onEvent);
        res.end();
    });
});
router.use("/therapies", therapies_1.default);
router.use("/progress", progress_1.default);
router.use("/auth", public_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map
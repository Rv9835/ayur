"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
router.post("/exchange", auth_1.verifyFirebaseUid, authController_1.exchangeUidForJwt);
router.post("/select-role", authController_1.selectRole);
router.post("/check-user", authController_1.checkUser);
exports.default = router;
//# sourceMappingURL=public.js.map
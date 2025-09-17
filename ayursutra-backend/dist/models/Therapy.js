"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Therapy = void 0;
const mongoose_1 = require("mongoose");
const TherapySchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: String,
    durationMinutes: { type: Number, required: true },
}, { timestamps: true });
exports.Therapy = (0, mongoose_1.model)("Therapy", TherapySchema);
//# sourceMappingURL=Therapy.js.map
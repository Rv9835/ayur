"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Appointment = void 0;
const mongoose_1 = require("mongoose");
const AppointmentSchema = new mongoose_1.Schema({
    patient: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    therapy: { type: mongoose_1.Schema.Types.ObjectId, ref: "Therapy", required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
        type: String,
        enum: ["scheduled", "in_progress", "completed", "cancelled"],
        default: "scheduled",
    },
    notes: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    duration: { type: Number },
    painLevel: { type: Number, min: 0, max: 10 },
    energyLevel: { type: Number, min: 0, max: 10 },
    moodLevel: { type: Number, min: 0, max: 10 },
    sleepQuality: { type: Number, min: 0, max: 10 },
    overallWellness: { type: Number, min: 0, max: 10 },
    symptoms: [{ type: String }],
    improvements: [{ type: String }],
}, { timestamps: true });
exports.Appointment = (0, mongoose_1.model)("Appointment", AppointmentSchema);
//# sourceMappingURL=Appointment.js.map
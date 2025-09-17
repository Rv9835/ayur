"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Feedback = void 0;
const mongoose_1 = require("mongoose");
const FeedbackSchema = new mongoose_1.Schema({
    by: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    aboutAppointment: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Appointment",
        required: true,
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: String,
}, { timestamps: true });
exports.Feedback = (0, mongoose_1.model)("Feedback", FeedbackSchema);
//# sourceMappingURL=Feedback.js.map
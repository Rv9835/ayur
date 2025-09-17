"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    uid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: {
        type: String,
        enum: ["patient", "doctor", "admin"],
        required: true,
    },
    specialty: { type: String }, // For doctors
    avatar: { type: String }, // Profile picture
    isApproved: { type: Boolean, default: false },
}, { timestamps: true });
exports.User = (0, mongoose_1.model)("User", UserSchema);
//# sourceMappingURL=User.js.map
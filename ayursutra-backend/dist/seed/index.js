"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const schedule_seed_1 = __importDefault(require("./schedule-seed"));
dotenv_1.default.config();
async function run() {
    try {
        await mongoose_1.default.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");
        await (0, schedule_seed_1.default)();
        console.log("✅ All seed data created successfully!");
    }
    catch (error) {
        console.error("❌ Error during seeding:", error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log("Disconnected from MongoDB");
    }
}
run().catch((e) => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=index.js.map
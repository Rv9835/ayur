"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = require("../models/User");
const Appointment_1 = require("../models/Appointment");
const Chat_1 = require("../models/Chat");
const router = express_1.default.Router();
// List threads for a patient: derive assigned doctors from appointments
router.get("/threads/patient/:patientId", async (req, res) => {
    try {
        const { patientId } = req.params;
        let patient = await User_1.User.findOne({ uid: patientId });
        if (!patient)
            patient = await User_1.User.findById(patientId);
        if (!patient)
            return res.status(404).json({ error: "Patient not found" });
        const appts = await Appointment_1.Appointment.find({ patient: patient._id }).populate("doctor", "name email specialty avatar uid");
        const doctorsMap = {};
        appts.forEach((a) => {
            const d = a.doctor;
            if (d?._id)
                doctorsMap[String(d._id)] = d;
        });
        // Ensure a chat exists for each doctor
        const threads = await Promise.all(Object.values(doctorsMap).map(async (doc) => {
            let chat = await Chat_1.Chat.findOne({
                participants: { $all: [patient._id, doc._id] },
            });
            if (!chat) {
                chat = await Chat_1.Chat.create({ participants: [patient._id, doc._id], messages: [] });
            }
            return {
                chatId: chat._id,
                doctor: { id: doc._id, name: doc.name, avatar: doc.avatar, specialty: doc.specialty, uid: doc.uid },
            };
        }));
        res.json(threads);
    }
    catch (error) {
        console.error("Error listing threads:", error);
        res.status(500).json({ error: "Failed to list message threads" });
    }
});
// Get messages for a chat
router.get("/threads/:chatId/messages", async (req, res) => {
    try {
        const { chatId } = req.params;
        const chat = await Chat_1.Chat.findById(chatId)
            .populate("participants", "name avatar role uid")
            .populate("messages.sender", "name avatar role uid");
        if (!chat)
            return res.status(404).json({ error: "Chat not found" });
        res.json({
            chatId: chat._id,
            participants: chat.participants,
            messages: chat.messages,
        });
    }
    catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});
// Send a message
router.post("/threads/:chatId/messages", async (req, res) => {
    try {
        const { chatId } = req.params;
        const { senderId, text, attachmentUrl } = req.body;
        // Resolve sender by uid or _id
        let sender = await User_1.User.findOne({ uid: senderId });
        if (!sender)
            sender = await User_1.User.findById(senderId);
        if (!sender)
            return res.status(400).json({ error: "Invalid sender" });
        const chat = await Chat_1.Chat.findById(chatId);
        if (!chat)
            return res.status(404).json({ error: "Chat not found" });
        const content = text && attachmentUrl ? `${text}\n${attachmentUrl}` : text || attachmentUrl || "";
        if (!content.trim())
            return res.status(400).json({ error: "Message content required" });
        chat.messages.push({ sender: sender._id, text: content, createdAt: new Date() });
        await chat.save();
        await chat.populate([
            { path: "messages.sender", select: "name avatar role uid" },
        ]);
        res.json({ chatId: chat._id, messages: chat.messages });
    }
    catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ error: "Failed to send message" });
    }
});
exports.default = router;
//# sourceMappingURL=messages.js.map
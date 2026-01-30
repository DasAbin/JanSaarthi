"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.simplifyRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const storage_1 = require("../utils/storage");
const simplifyService_1 = require("../services/simplifyService");
const upload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, (0, storage_1.storagePath)("pdfs")),
        filename: (_req, file, cb) => {
            const ext = path_1.default.extname(file.originalname) || ".pdf";
            cb(null, `${(0, uuid_1.v4)()}${ext}`);
        }
    })
});
exports.simplifyRouter = (0, express_1.Router)();
const simplify = new simplifyService_1.SimplifyService();
exports.simplifyRouter.post("/", upload.single("file"), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ error: "file is required" });
        const language = req.body.language || "en";
        const result = await simplify.simplifyDocument({
            filePath: req.file.path,
            originalName: req.file.originalname,
            language
        });
        return res.json(result);
    }
    catch (err) {
        console.error("[API ERROR]", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
//# sourceMappingURL=simplify.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const express_2 = __importDefault(require("express"));
const storage_1 = require("./utils/storage");
const ocr_1 = require("./routes/ocr");
const simplify_1 = require("./routes/simplify");
const yojana_1 = require("./routes/yojana");
const formHelper_1 = require("./routes/formHelper");
const voice_1 = require("./routes/voice");
const learn_1 = require("./routes/learn");
async function main() {
    await (0, storage_1.ensureStorageDirs)();
    const app = (0, express_1.default)();
    let PORT = Number(process.env.PORT || 4000);
    app.use((0, cors_1.default)());
    app.use(express_1.default.json({ limit: "25mb" }));
    app.use((0, morgan_1.default)("dev"));
    app.use("/static", express_2.default.static((0, storage_1.storageRoot)(), { maxAge: "1d" }));
    app.get("/api/health", (_req, res) => {
        res.json({ status: "ok", service: "jan-saarthi-backend" });
    });
    app.use("/api/ocr", ocr_1.ocrRouter);
    app.use("/api/simplify", simplify_1.simplifyRouter);
    app.use("/api/yojana", yojana_1.yojanaRouter);
    app.use("/api/form-helper", formHelper_1.formHelperRouter);
    app.use("/api/voice", voice_1.voiceRouter);
    app.use("/api/learn", learn_1.learnRouter);
    const server = await new Promise((resolve, reject) => {
        const s = app.listen(PORT, () => {
            console.log(`JanSaarthi backend running on http://localhost:${PORT}`);
            resolve(s);
        });
        s.on("error", (err) => {
            if (err.code === "EADDRINUSE" && PORT === 4000) {
                PORT = 5000;
                console.warn("Port 4000 in use, switching to 5000");
                const s2 = app.listen(PORT, () => {
                    console.log(`JanSaarthi backend running on http://localhost:${PORT}`);
                    resolve(s2);
                });
                s2.on("error", reject);
            }
            else
                reject(err);
        });
    });
    const shutdown = () => {
        server.close(() => {
            console.log("Server closed");
            process.exit(0);
        });
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
}
main().catch((err) => {
    console.error("Fatal startup error:", err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map
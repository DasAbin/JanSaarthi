"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearnService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const storage_1 = require("../utils/storage");
class LearnService {
    async listModules() {
        const dir = (0, storage_1.storagePath)("knowledge", "modules");
        const files = await promises_1.default.readdir(dir);
        const modules = await Promise.all(files
            .filter((f) => f.endsWith(".json"))
            .map(async (f) => {
            const id = path_1.default.basename(f, ".json");
            const raw = await promises_1.default.readFile(path_1.default.join(dir, f), "utf-8");
            const json = JSON.parse(raw);
            return { id, title: json.title, description: json.description };
        }));
        return modules;
    }
    async getModule(moduleId) {
        const p = (0, storage_1.storagePath)("knowledge", "modules", `${moduleId}.json`);
        const raw = await promises_1.default.readFile(p, "utf-8");
        const json = JSON.parse(raw);
        json.id = moduleId;
        return json;
    }
}
exports.LearnService = LearnService;
//# sourceMappingURL=learnService.js.map
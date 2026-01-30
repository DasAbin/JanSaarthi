import fs from "fs/promises";
import path from "path";
import { storagePath } from "../utils/storage";

export type QuizItem = {
  question: string;
  options: string[];
  answerIndex: number;
};

export type Lesson = {
  title: string;
  content: string;
  quiz?: QuizItem[];
};

export type LearningModule = {
  id?: string;
  title: string;
  description: string;
  lessons: Lesson[];
};

export class LearnService {
  async listModules(): Promise<{ id: string; title: string; description: string }[]> {
    const dir = storagePath("knowledge", "modules");
    const files = await fs.readdir(dir);
    const modules = await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map(async (f) => {
          const id = path.basename(f, ".json");
          const raw = await fs.readFile(path.join(dir, f), "utf-8");
          const json = JSON.parse(raw) as LearningModule;
          return { id, title: json.title, description: json.description };
        })
    );
    return modules;
  }

  async getModule(moduleId: string): Promise<LearningModule> {
    const p = storagePath("knowledge", "modules", `${moduleId}.json`);
    const raw = await fs.readFile(p, "utf-8");
    const json = JSON.parse(raw) as LearningModule;
    json.id = moduleId;
    return json;
  }
}


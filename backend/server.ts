import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import morgan from "morgan";
import expressStatic from "express";

import { ensureStorageDirs, storageRoot } from "./utils/storage";
import { ocrRouter } from "./routes/ocr";
import { simplifyRouter } from "./routes/simplify";
import { yojanaRouter } from "./routes/yojana";
import { formHelperRouter } from "./routes/formHelper";
import { voiceRouter } from "./routes/voice";
import { learnRouter } from "./routes/learn";

async function main() {
  await ensureStorageDirs();

  const app = express();
  let PORT = Number(process.env.PORT || 4000);

  app.use(cors());
  app.use(express.json({ limit: "25mb" }));
  app.use(morgan("dev"));

  app.use("/static", expressStatic.static(storageRoot(), { maxAge: "1d" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "jan-saarthi-backend" });
  });

  app.use("/api/ocr", ocrRouter);
  app.use("/api/simplify", simplifyRouter);
  app.use("/api/yojana", yojanaRouter);
  app.use("/api/form-helper", formHelperRouter);
  app.use("/api/voice", voiceRouter);
  app.use("/api/learn", learnRouter);

  const server = await new Promise<ReturnType<express.Express["listen"]>>((resolve, reject) => {
    const s = app.listen(PORT, () => {
      console.log(`JanSaarthi backend running on http://localhost:${PORT}`);
      resolve(s);
    });
    s.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE" && PORT === 4000) {
        PORT = 5000;
        console.warn("Port 4000 in use, switching to 5000");
        const s2 = app.listen(PORT, () => {
          console.log(`JanSaarthi backend running on http://localhost:${PORT}`);
          resolve(s2);
        });
        s2.on("error", reject);
      } else reject(err);
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


import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import dotenv from "dotenv";

import { ocrRouter } from "./routes/ocr";
import { simplifyRouter } from "./routes/simplify";
import { yojanaRouter } from "./routes/yojana";
import { formHelperRouter } from "./routes/formHelper";
import { voiceRouter } from "./routes/voice";
import { learnRouter } from "./routes/learn";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// Static access to stored files if needed
app.use(
  "/static",
  express.static(path.join(__dirname, "..", "storage"), {
    maxAge: "1d"
  })
);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "lok-saarthi-backend" });
});

// Feature routes
app.use("/api/ocr", ocrRouter);
app.use("/api/simplify", simplifyRouter);
app.use("/api/yojana", yojanaRouter);
app.use("/api/form-helper", formHelperRouter);
app.use("/api/voice", voiceRouter);
app.use("/api/learn", learnRouter);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`LokSaarthi backend running on http://localhost:${PORT}`);
});


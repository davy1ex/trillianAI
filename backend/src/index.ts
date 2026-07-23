import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";
import yaml from "js-yaml";
import fs from "fs";
import { conversationRoutes } from "./entities/conversation/routes";
import { messageRoutes } from "./entities/message/routes";
import { modelRoutes } from "./entities/model/routes";
import { chatRoutes } from "./chat/routes";

const app = express();
app.use(cors());
app.use(express.json());

const openapiPath = path.resolve(
  fileURLToPath(import.meta.url), "..", "..", "openapi.yaml",
);
const openapiSpec = yaml.load(fs.readFileSync(openapiPath, "utf8")) as Record<string, unknown>;
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.get("/api/openapi.yaml", (_req, res) => {
  res.sendFile(openapiPath);
});

app.use("/api/conversations", conversationRoutes);
app.use("/api", messageRoutes);
app.use("/api/models", modelRoutes);
app.use("/api/chat", chatRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = parseInt(process.env.PORT || "3001", 10);
app.listen(PORT, () => {
  console.info(`Server running on http://localhost:${PORT}`);
});

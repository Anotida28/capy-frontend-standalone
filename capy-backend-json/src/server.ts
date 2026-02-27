import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import morgan from "morgan";
import { CONFIG } from "./config.js";
import { basicAuthMiddleware } from "./middleware/basic-auth.js";
import { financeRouter } from "./routes/finance.js";
import { healthRouter } from "./routes/health.js";
import { operationsRouter } from "./routes/operations.js";

const app = express();

const corsOrigins = CONFIG.corsOrigin
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.use("/health", healthRouter);
app.use("/api/v1/finance", basicAuthMiddleware, financeRouter);
app.use("/api/v1", basicAuthMiddleware, operationsRouter);

app.use((_req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status = typeof (error as { status?: unknown })?.status === "number"
    ? ((error as { status: number }).status)
    : 500;
  const message = error instanceof Error ? error.message : "Internal server error";
  if (status >= 500) {
    // Keep stack traces out of client responses, but log server-side.
    // eslint-disable-next-line no-console
    console.error(error);
  }
  res.status(status).json({ message });
});

app.listen(CONFIG.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${CONFIG.port}`);
});

import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { cloudSessionAuth } from "./middleware/cloud-session-auth.js";
import { desktopCompatAuth } from "./middleware/desktop-compat-auth.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { compatActivityRouter } from "./routes/compat/activity.js";
import { compatModelsRouter } from "./routes/compat/models.js";
import { compatPromptRouter } from "./routes/compat/prompt.js";
import { compatPromptsRouter } from "./routes/compat/prompts.js";
import { compatResponseRouter } from "./routes/compat/response.js";
import { internalSessionsRouter } from "./routes/internal/sessions.js";
import { runtimeAudioRouter } from "./routes/runtime/audio.js";
import { runtimeChatRouter } from "./routes/runtime/chat.js";

const app = express();

app.disable("x-powered-by");
app.use(requestIdMiddleware);
app.use(
  pinoHttp({
    customProps: (req) => ({ requestId: req.requestId })
  })
);
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "rieko-cloud",
    environment: env.NODE_ENV,
    publicUrl: env.RIEKO_CLOUD_PUBLIC_URL,
    productionUrl: env.RIEKO_CLOUD_PRODUCTION_URL
  });
});

app.use("/compat", desktopCompatAuth, compatModelsRouter);
app.use("/compat", desktopCompatAuth, compatPromptsRouter);
app.use("/compat", desktopCompatAuth, compatPromptRouter);
app.use("/compat", desktopCompatAuth, compatResponseRouter);
app.use("/compat", desktopCompatAuth, compatActivityRouter);

app.use("/internal", desktopCompatAuth, internalSessionsRouter);

app.use("/runtime", cloudSessionAuth, runtimeChatRouter);
app.use("/runtime", cloudSessionAuth, runtimeAudioRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`rieko-cloud listening on port ${env.PORT}`);
});

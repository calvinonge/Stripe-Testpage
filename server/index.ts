import express, { type ErrorRequestHandler } from "express";
import { createServer } from "node:http";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";

const app = express();
const httpServer = createServer(app);

app.disable("x-powered-by");
if (process.env.RENDER === "true") {
  app.set("trust proxy", 1);
}
app.use(express.json({ limit: "8kb" }));

async function start() {
  registerRoutes(app);
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const handleError: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === "entity.parse.failed") {
      return res.status(400).json({ error: "Send a valid JSON request." });
    }
    if (error.type === "entity.too.large") {
      return res.status(413).json({ error: "The request is too large." });
    }
    console.error("[express] Request failed", error.name);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  };
  app.use(handleError);

  const port = Number(process.env.PORT || "5000");
  httpServer.listen(port, "0.0.0.0", () => console.log(`Listening on port ${port}`));

  process.once("SIGTERM", () => httpServer.close());
}

start().catch((error: unknown) => {
  console.error("Could not start the server", error);
  process.exitCode = 1;
});

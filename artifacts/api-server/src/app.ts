import express, { type Express, Request, Response } from "express";
import cors from "cors";
import { createRequire } from "module";
import router from "./routes";
import { logger } from "./lib/logger";

const require = createRequire(import.meta.url);
const pinoHttp = require("pino-http");

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: Request) {
        return {
          id: (req as any).id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: Response) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;

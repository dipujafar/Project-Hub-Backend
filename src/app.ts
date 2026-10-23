import cookieParser from "cookie-parser";
import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import config from "./config";
import notFound from "./middleware/notfound";
import globalErrorHandler from "./middleware/globalErrorHandler";
import router from "./routes";

const app: Application = express();

app.use(
  cors({
    origin: config.app_url,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1", router);
0
app.get("/", (req: Request, res: Response) => {
  res.send("server is running");
});

app.use(globalErrorHandler);

//Not Found
app.use(notFound);

export default app;

declare global {
  var appRoot: string;
  var repos_location: string;
  var saltRound: number;
}

import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import os from "os";
import path from "path";
import cookieParser from "cookie-parser";

import users from "./routes/users";
import username from "./routes/username";
import authRoute from "./routes/auth";
import setupRoute from "./routes/setup";

import gitMiddleware from "./middleware/gitMiddleware";
import ensureSetupComplete from "./middleware/ensureSetupComplete";
import { userAutheticate } from "./middleware/authenticationMiddleware";


global.saltRound = 10;
global.appRoot = __dirname.replace("\\dist", "").replace("/dist", "");

if (process.env.REPOSITORIES_LOCATION == "") {
  global.repos_location = path.join(global.appRoot, "repos");
} else if (os.type() === "Windows_NT") {
  if (process.env.REPOSITORIES_LOCATION.startsWith(":/", 1))
    global.repos_location = process.env.REPOSITORIES_LOCATION;
  else
    global.repos_location = path.join(
      global.appRoot,
      process.env.REPOSITORIES_LOCATION,
    );
} else if (os.type() === "Linux") {
  if (process.env.REPOSITORIES_LOCATION.startsWith("/"))
    global.repos_location = process.env.REPOSITORIES_LOCATION;
  else
    global.repos_location = path.join(
      global.appRoot,
      process.env.REPOSITORIES_LOCATION,
    );
} else if (os.type() === "Darwin") {
  throw Error("Mac is not supported");
}

const allowedOrigins = [
  process.env.FRONTEND_URL_DEV,
  process.env.FRONTEND_URL_STAGING,
  process.env.FRONTEND_URL_PROD,
];

const expressApp = express();
expressApp.use(
  // cors({
  //   origin: "http://localhost:4200",
  //   credentials: true,
  //   allowedHeaders: ["type", "content-type"],
  //   exposedHeaders: ["type"],
  //   methods: ["GET", "POST", "PUT", "DELETE"],
  // }),
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    allowedHeaders: ["type", "content-type"],
    exposedHeaders: ["type"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);
expressApp.set("trust proxy", true);
expressApp.use(express.json());
expressApp.use(cookieParser());
expressApp.use(gitMiddleware);

expressApp.use("/setup", ensureSetupComplete, setupRoute);
expressApp.use("/auth", userAutheticate, authRoute);
expressApp.use("/users", userAutheticate, users);
expressApp.use("/:username", userAutheticate, username);

const port = process.env.HTTP_PORT;
expressApp.listen(port, () => {
  console.log(`GIT_DAMN API listening on port ${port}`);
});

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
import mongoose from 'mongoose';

import users from "./routes/users";
import username from "./routes/username";
import username_repo_name from "./routes/[username]/[repo_name]";
import authRoute from "./routes/auth";
import setupRoute from "./routes/setup";

import gitMiddleware from "./middleware/gitMiddleware";
import { verifyJWT, loadRepo, requireRepoAccess, requireRepoOwner } from "./middleware/authenticationMiddleware";


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

expressApp.use("/setup", setupRoute);
expressApp.use("/auth", authRoute);
expressApp.use("/users", verifyJWT, users);
expressApp.use("/:username", verifyJWT, username);
expressApp.use("/:username/:repo_name", loadRepo, requireRepoAccess, username_repo_name);
expressApp.use("/:username/:repo_name/settings", requireRepoOwner, username_repo_name);

const port = process.env.HTTP_PORT;

async function start() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/GIT_DAMN");
  expressApp.listen(port, () => {
    console.log(`GIT_DAMN API listening on port ${port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
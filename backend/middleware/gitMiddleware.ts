import { NextFunction, Request, Response } from "express";

import { spawn } from "child_process";
import * as path from "path";
import backend from "git-http-backend";
import * as zlib from "zlib";

import { HydratedDocument, InferSchemaType } from "mongoose";
import { Repository, repositorySchema } from "../models/Repository";
import { User } from '../models/User';
import { authenticateUser } from '../services/authService';
type IRepository = InferSchemaType<typeof repositorySchema>;

export default async function gitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user_agent = req.headers["user-agent"];
    const urlSegments = req.url.split("/");
    const user = urlSegments[1];
    const repo = urlSegments[2];

    if (!user_agent || user_agent?.indexOf("git") === -1) {
      next();
      return;
    }

    // basic auth
    const b64auth = (req.headers.authorization || "").split(" ")[1] || "";
    const [login, password] = Buffer.from(b64auth, "base64")
      .toString()
      .split(":");

    const validLogin = await authenticate(login, password);

    if (!validLogin) {
      res.set("www-Authenticate", 'Basic realm="401"');
      res.status(401).send("Authentication required.");
      return;
    }

    const isAuthorized = await authorize(login, user, repo);

    if (!isAuthorized) {
      res.status(403).send("Not authorized to access this repository.");
      return;
    }

    if (!req.url) throw new Error("missing url");

    const dir = path.join(global.appRoot, "repos", `${user}/${repo}`);
    const reqStream =
      req.headers["content-encoding"] == "gzip"
        ? req.pipe(zlib.createGunzip())
        : req;

    reqStream
      .pipe(
        new backend(req.url, function (err, service) {
          if (err) return res.end(err + "\n");

          res.setHeader("content-type", service.type);
          const ps = spawn(service.cmd, service.args.concat(dir));
          ps.stdout.pipe(service.createStream()).pipe(ps.stdin);
        }),
      )
      .pipe(res);
  } catch (err) {
    console.log(err);
  }
}

async function authenticate(login: string, password: string): Promise<boolean> {
  const user = await authenticateUser(login, password)
  return user !== null;
}

async function authorize(
  login: string,
  username: string,
  repo: string,
): Promise<boolean> {
  const repo_object = await getRepoInformation(username, repo);

  if (repo_object.visibility === "public") {
    return true;
  } else {

    const user = User.findOne({ username: login });
    const user_in_al = repo_object.accessList
      .map((al) => al.user.toString())
      .includes(login);
    return user_in_al;
  }
}

async function getRepoInformation(
  username: string,
  repo_name: string,
): Promise<HydratedDocument<IRepository>> {
  try {
    const result = await Repository.findOne({
      owner: username,
      name: repo_name,
    });
    if (result) return result;
    else throw Error("Error retrieving repo information");
  } catch (err) {
    console.log(err);
    throw Error("Error retrieving repo information");
  }
}

interface Repo_Object {
  _id: string;
  name: string;
  visibility: string;
  owner: string;
  accessList: Repo_Access[];
}

interface Repo_Access {
  username: string;
  permission: string;
}

import { NextFunction, Request, Response } from "express";

import { spawn } from "child_process";
import * as path from "path";
import backend from "git-http-backend";
import * as zlib from "zlib";
import { MongoClient } from "mongodb";

const mongoURI = process.env.uri || "mongodb://127.0.0.1:27017";

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

    const baseUrl = `${req.protocol}://${req.get("host")}/`;
    const validLogin = await authenticate(baseUrl, login, password);

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
          //console.log(service.cmd, service.args.concat(dir))
          const ps = spawn(service.cmd, service.args.concat(dir));
          ps.stdout.pipe(service.createStream()).pipe(ps.stdin);
        }),
      )
      .pipe(res);
  } catch (err) {
    console.log(err);
  }
}

async function authenticate(
  baseUrl: string,
  login: string,
  password: string,
): Promise<boolean> {
  // const url = process.env.API_URI + 'auth/login'
  const url = baseUrl + "auth/login";
  const options: RequestInit = {
    method: "POST",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      username: login,
      password,
    }),
  };
  const response = await fetch(url, options);

  if (!response.ok) console.log("Login Failed: " + (await response.json()));
  return response.ok;
}

async function authorize(
  login: string,
  username: string,
  repo: string,
): Promise<boolean> {
  const repo_object: Repo_Object = await getRepoInformation(username, repo);

  if (repo_object.visibility === "public") {
    return true;
  } else {
    var user = repo_object.accessList.find((e) => e.username === login);
    if (user) return true;
    else return false;
  }
}

async function getRepoInformation(
  username: string,
  repo_name: string,
): Promise<Repo_Object> {
  const client = new MongoClient(mongoURI);
  try {
    const GIT_DAMN = client.db("GIT_DAMN");
    const repositoryDB = GIT_DAMN.collection<Repo_Object>("repositories");
    const result = await repositoryDB.findOne({
      owner: username,
      name: repo_name,
    });
    if (result) return result;
    else throw Error("Error retrieving repo information");
  } catch (err) {
    console.log(err);
    throw Error("Error retrieving repo information");
  } finally {
    await client.close();
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

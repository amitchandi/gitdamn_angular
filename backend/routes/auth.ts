import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { MongoClient } from "mongodb";
import path from "path";
import fs from "fs";
import { userAutheticate } from "../middleware/authenticationMiddleware";

const fsPromises = fs.promises;
const saltRound = 10;
const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";

const router = express.Router();

const usernameBlackList: string[] = [
  "admin",
  "commit",
  "login",
  "logout",
  "notfound",
  "repository",
  "username",
  "users",
  "assets"
]; // blacklist to protect against Angular routing collisions

router.get("/verify", userAutheticate, async (req: Request, res: Response) => {
  res.end();
});

router.post("/register", userAutheticate, async (req: Request, res: Response) => {
  const client = new MongoClient(mongoURI);
  try {
    const { email, username, password, role } = req.body;

    // validate username from blacklist
    if (usernameBlackList.includes(username))
      return res.status(400).send("Invalid username");

    const salt = await bcrypt.genSalt(saltRound);
    const hashedPass = await bcrypt.hash(password, salt);

    const repo_path = path.join(global.repos_location, username);

    if (fs.existsSync(repo_path))
      return res.status(400).send("User repository already exists");

    await fsPromises.mkdir(repo_path);

    const database = client.db("GIT_DAMN");
    const users = database.collection("users");

    let result: any = await users.findOne({
      email: email,
    });

    if (result) return res.status(400).send("User already exists");

    result = await users.findOne({
      username: username,
    });

    if (result) return res.status(400).send("User already exists");

    result = await users.insertOne({
      email: email,
      username: username,
      password: hashedPass,
      role: role,
    });

    const jwt_payload = {
      user_id: result.insertedId,
      username: username,
      role: role,
    };

    const maxAge = 3 * 60 * 60;

    const jwt_options = {
      expiresIn: maxAge,
    };

    const token = jwt.sign(jwt_payload, process.env.JWT_SECRET, jwt_options);

    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: maxAge * 1000,
    });

    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  } finally {
    await client.close();
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const client = new MongoClient(mongoURI);
  try {
    const { username, password } = req.body;
    const database = client.db("GIT_DAMN");
    const users = database.collection("users");
    const query = { username: username };
    const result = await users.findOne(query);
    if (!result) res.status(400).json("invalid username");
    else {
      var match = await bcrypt.compare(password, result.password);
      if (match) {
        delete result.password;

        const jwt_payload = {
          user_id: result._id,
          username: username,
          role: result.role,
        };

        const maxAge = 3 * 60 * 60;

        const jwt_options = {
          expiresIn: maxAge,
        };

        const token = jwt.sign(
          jwt_payload,
          process.env.JWT_SECRET,
          jwt_options,
        );

        res.cookie("jwt", token, {
          httpOnly: true,
          maxAge: maxAge * 1000,
        });

        res.status(200).json(result);
      } else res.status(400).json("password");
    }
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  } finally {
    await client.close();
  }
});

export default router;

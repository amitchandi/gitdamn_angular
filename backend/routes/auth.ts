import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import { verifyJWT } from "../middleware/authenticationMiddleware";
import { User } from '../models/User';
import { authenticateUser, AuthError } from '../services/authService';

const fsPromises = fs.promises;
const saltRound = global.saltRound;

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

router.get("/verify", verifyJWT, async (req: Request, res: Response) => {
  res.end();
});

router.post("/register", verifyJWT, async (req: Request, res: Response) => {
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


    let result: any = await User.findOne({
      email: email,
    });

    if (result) return res.status(400).send("User already exists");

    result = await User.findOne({
      username: username,
    });

    if (result) return res.status(400).send("User already exists");

    result = await User.insertOne({
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
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const username = req.body.username;
    const _password = req.body.password;

    const user = await authenticateUser(username, _password);

    const jwt_payload = {
      user_id: user._id,
      username: username,
      role: user.role,
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

    const { password, ...userRes } = user.toObject();

    res.status(200).json(userRes);
  } catch (err) {
    console.log(err);
    if (err instanceof AuthError) {
      return res.status(401).json({ error: err.message });
    }
    res.status(400).json(err);
  }
});

export default router;

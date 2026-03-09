import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import simpleGit from "simple-git";
import { Repository } from '../../models/Repository';

import {
  lsTree_Object,
  lsTree_Root,
  show_File,
  lsTree_Directory,
} from "../../services/gitService";
import { requireRepoOwner } from '../../middleware/authenticationMiddleware';

const fsPromises = fs.promises;
const router = express.Router({ mergeParams: true });

router.get("/", async (req: Request, res: Response) => {
  const { repo_name } = req.params;
  try {
    const result = await Repository.findOne({
      owner: req.user?.user_id,
      name: repo_name,
    });
    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(400).send("error");
  }
});

router.get("/branches", async (req: Request, res: Response) => {
  const repo_name = req.params.repo_name;
  try {
    const repo_dir = path.join(
      global.repos_location,
      req.params.username,
      repo_name,
    );
    const git = simpleGit(repo_dir);
    const result = await git.branchLocal();
    if (!result.current) result.current = "main"; // for new repos
    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(400).end();
  }
});

router.get(
  ["/log", "/log/:branchOrHash"],
  async (req: Request, res: Response) => {
    const { username, repo_name, branchOrHash } = req.params;
    const repo_dir = path.join(global.repos_location, username, repo_name);
    try {
      const args: any = [];
      if (branchOrHash) args[0] = branchOrHash;
      const git = simpleGit(repo_dir);
      const result = await git.log(args);
      res.status(200).json(result);
    } catch (err) {
      // check if repo has any commits
      const commands = ["rev-list", "-n", "1", "--all"];
      const result = await simpleGit(repo_dir).raw(
        ...commands,
      );
      if (result == "") {
        // no commits
        res.status(204).send(err);
      } else {
        //has commits - unknown issue
        console.log(err);
        res.status(500).send(err);
      }
    }
  },
);

router.get(
  ["/log/:branch/:filename"],
  async (req: Request, res: Response) => {
    const { username, repo_name, branch, filename } = req.params;
    const repo_dir = path.join(global.repos_location, username, repo_name);
    try {
      const commands = [
        "log",
        '--pretty=format:{%n  "hash": "%H"%n,%n  "abbreviated hash": "%h"%n,%n  "date": "%aI",%n  "message": "%s",%n  "refs": "%D",%n  "body": "%b",%n  "author_name": "%an",%n  "author_email": "%ae"},',
        branch,
        "--",
        filename,
      ];
      let result = await simpleGit(repo_dir).raw(...commands);
      result = "[" + result.substring(0, result.length - 1) + "]";
      let json = JSON.parse(result);
      res.status(200).json(json);
    } catch (err) {
      console.log(err);
      res.status(404).json(err);
    }
  },
);

router.get(
  "/show/:hash/:filepath",
  async (req: Request, res: Response) => {
    const { username, repo_name, hash, filepath } = req.params;
    try {
      const result = await lsTree_Object(username, repo_name, hash, filepath);
      if (result === "") {
        res.status(404).json("Not Found");
        return;
      }
      const data = await show_File(username, repo_name, result.objectId);
      res.status(200).json(data);
    } catch (err) {
      console.log(err);
      res.status(400).send(err);
    }
  },
);

router.get(
  [
    "/ls_tree/object/:hash/:filepath",
    "/ls_tree/dir/:hash/:filepath",
  ],
  async (req: Request, res: Response) => {
    const { username, repo_name, hash, filepath } = req.params;
    const id_or_dir = req.url.split("/")[3];
    try {
      if (id_or_dir === "object") {
        const result = await lsTree_Object(username, repo_name, hash, filepath);
        res.status(200).json(result);
      } else {
        const result = await lsTree_Directory(
          username,
          repo_name,
          hash,
          filepath,
        );
        res.status(200).json(result);
      }
    } catch (err) {
      console.log(err);
      res.status(400).send(err);
    }
  },
);

router.get(
  "/ls_tree/dir/:hash",
  async (req: Request, res: Response) => {
    const { username, repo_name, hash } = req.params;
    try {
      const result = await lsTree_Root(username, repo_name, hash);
      res.status(200).json(result);
    } catch (err) {
      console.log(err);
      res.status(400).send(err);
    }
  },
);

router.delete("/", requireRepoOwner, async (req: Request, res: Response) => {
  try {
    const { username, repo_name } = req.params;

    const result = await Repository.deleteOne({
      name: repo_name,
      owner: req.user?.user_id,
    });

    if (!result.acknowledged) {
      res.status(400).send("Database error");
    } else {
      res.status(200).send("Deleted repository");
      const repo_dir = path.join(global.repos_location, username, repo_name);
      await fsPromises.rm(repo_dir, { recursive: true, force: true });
    }
  } catch (err) {
    console.log(err);
    res.status(400).send("Error deleting repository.");
  }
});

export default router;
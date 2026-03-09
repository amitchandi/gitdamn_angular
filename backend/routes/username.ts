import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import simpleGit from "simple-git";
import { Repository } from '../models/Repository';

const fsPromises = fs.promises;
const router = express.Router({ mergeParams: true });

router.get("/", async (req: Request, res: Response) => {
  try {
    const repos = await Repository.find({
      $or: [
        { visibility: "public" },
        { "accessList.user": req.user?.user_id },
        { owner: req.user?.user_id },
      ]
    });
    res.status(200).json(repos);
  } catch (err) {
    console.log(err);
    res.status(400).end();
  }
});

router.post("/new_repo", async (req: Request, res: Response) => {
  const { username } = req.params;

  let { repositoryName, repositoryDescription, visibility } = req.body;

  if (!repositoryName.includes(".git"))
    repositoryName = repositoryName + ".git";

  const repo_dir = path.join(global.repos_location, username, repositoryName);
  const hooks_dir = path.join(repo_dir, "hooks");
  const source_hooks_dir = path.join(global.appRoot, "hooks");

  try {
    await Repository.create({
      name: repositoryName,
      visibility: visibility,
      owner: req.user?.user_id,
      description: repositoryDescription,
      accessList: [],
    });

    await fsPromises.mkdir(repo_dir);
    const git = simpleGit(repo_dir, { binary: "git" });
    await git.init(true);
    await git.clone("./", "./files/main"); //needs branch name for folder
    await fsPromises.rm(hooks_dir, { recursive: true, force: true });
    await fsPromises.mkdir(hooks_dir);
    const files = await fsPromises.readdir(source_hooks_dir, {
      withFileTypes: true,
    });

    files.forEach((file) => {
      if (file === null) return;
      const hook_file = path.join("hooks", file.name);
      fs.readFile(
        path.join(global.appRoot, hook_file),
        async (err, contents) => {
          if (err) return console.log(err);
          const filepath = path.join(repo_dir, hook_file);
          await fsPromises.writeFile(filepath, new Uint8Array(contents));
          fsPromises.chmod(filepath, "711");
        },
      );
    });

    res.status(200).send(`/${username}/${repositoryName}`);
  } catch (err: any) {
    console.log(err);

    await fsPromises.rm(repo_dir, { recursive: true, force: true });

    if (err.code === 11000)
      res.status(409).send("Repository already exists.");
    else
      res.status(400).send("Cannot create repository.");
  }
});

export default router;

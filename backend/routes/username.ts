import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import simpleGit from "simple-git";
import { MongoClient } from "mongodb";

import {
  lsTree_Object,
  lsTree_Root,
  show_File,
  lsTree_Directory,
} from "../services/gitService";

const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";

const fsPromises = fs.promises;
const router = express.Router({ mergeParams: true });

router.get("/", async (req: Request, res: Response) => {
  const client = new MongoClient(mongoURI);
  try {
    const GIT_DAMN = client.db("GIT_DAMN");
    const repositories = GIT_DAMN.collection("repositories");
    const repos = repositories.find({
      owner: req.params.username,
    });

    const results = [];

    while (await repos.hasNext()) {
      results.push(await repos.next());
    }

    res.status(200).json(results);
  } catch (err) {
    console.log(err);
    res.status(400).end();
  }
});

router.get("/:repo_name/branches", async (req: Request, res: Response) => {
  const repo_name = req.params.repo_name;
  const repo_dir = path.join(
    global.repos_location,
    req.params.username,
    repo_name,
  );
  try {
    const git = simpleGit(repo_dir);
    const result = await git.branchLocal();
    if (!result.current) result.current = "main"; // for new repos
    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(400).end();
  }
});

router.get("/:repo_name", async (req: Request, res: Response) => {
  const { username, repo_name } = req.params;
  const client = new MongoClient(mongoURI);
  try {
    const GIT_DAMN = client.db("GIT_DAMN");
    const repositoryDB = GIT_DAMN.collection("repositories");
    const result = await repositoryDB.findOne({
      owner: username,
      name: repo_name,
    });
    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(400).send("error");
  } finally {
    await client.close();
  }
});

router.get(
  ["/:repo_name/log", "/:repo_name/log/:branchOrHash"],
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
      const result = await simpleGit("repos/chandiman/test.git").raw(
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
  ["/:repo_name/log/:branch/:filename"],
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
  "/:repo_name/show/:hash/:filepath",
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
    "/:repo_name/ls_tree/object/:hash/:filepath",
    "/:repo_name/ls_tree/dir/:hash/:filepath",
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
  "/:repo_name/ls_tree/dir/:hash",
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

router.post("/new_repo", async (req: Request, res: Response) => {
  const { username } = req.params;

  let { repositoryName, repositoryDescription, visibility } = req.body;

  if (!repositoryName.includes(".git"))
    repositoryName = repositoryName + ".git";

  const repo_dir = path.join(global.repos_location, username, repositoryName);
  const hooks_dir = path.join(repo_dir, "hooks");
  const source_hooks_dir = path.join(global.appRoot, "hooks");
  const client = new MongoClient(mongoURI);

  try {
    const GIT_DAMN = client.db("GIT_DAMN");
    const repositoryDB = GIT_DAMN.collection("repositories");
    const result = await repositoryDB.insertOne({
      name: repositoryName,
      visibility: visibility,
      owner: username,
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
          await fsPromises.writeFile(filepath, contents);
          fsPromises.chmod(filepath, "711");
        },
      );
    });

    if (!result.acknowledged) res.status(400).send("Database error");
    else res.status(200).send(`/${username}/${repositoryName}`);
  } catch (err: any) {
    console.log(err);

    await fsPromises.rm(repo_dir, { recursive: true, force: true });

    if (err.code === "EEXIST")
      res.status(400).send("Repository already exists.");
    else res.status(400).send("Cannot create repository.");
  } finally {
    await client.close();
  }
});

router.delete("/:repo_name", async (req: Request, res: Response) => {
  const client = new MongoClient(mongoURI);
  try {
    const { username, repo_name } = req.params;

    const GIT_DAMN = client.db("GIT_DAMN");
    const repositories = GIT_DAMN.collection("repositories");
    const result = await repositories.deleteOne({
      name: repo_name,
      owner: username,
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
  } finally {
    await client.close();
  }
});

router.put("/:repo_name/addUser", async (req: Request, res: Response) => {
  const client = new MongoClient(mongoURI);
  try {
    const { username, repo_name } = req.params;

    const GIT_DAMN = client.db("GIT_DAMN");
    const repositories = GIT_DAMN.collection("repositories");

    const filter = {
      name: repo_name,
      owner: username,
    };

    const repo = await repositories.findOne(filter);

    if (!repo) {
      res.status(400).send("Repository does not exist under user.");
      return;
    }

    if (
      repo.accessList.map((al: any) => al.username).indexOf(req.body.username) >
      -1
    ) {
      res.status(400).send("User is already on the access list.");
      return;
    }

    const result = await repositories.updateOne(filter, {
      $push: { accessList: req.body },
    });

    if (!result.acknowledged)
      res.status(400).send("Error updating repository.");
    else res.status(200).send("Updated successfully.");
  } catch (err) {
    console.log(err);
    res.status(400).send("There was an error adding the rpository.");
  } finally {
    await client.close();
  }
});

router.put(
  "/:repo_name/changeUserPermission",
  async (req: Request, res: Response) => {
    const client = new MongoClient(mongoURI);
    try {
      const { username, repo_name } = req.params;
      const GIT_DAMN = client.db("GIT_DAMN");
      const repositories = GIT_DAMN.collection("repositories");

      const filter = {
        name: repo_name,
        owner: username,
      };

      const repo = await repositories.findOne(filter);

      if (!repo) {
        res.status(400).send("Repository does not exist under user.");
        return;
      }

      if (
        repo.accessList
          .map((al: any) => al.username)
          .indexOf(req.body.username) == -1
      ) {
        res
          .status(400)
          .send("User does not exist in the access list of the repo..");
        return;
      }

      let result1 = await repositories.deleteOne({
        username: req.body.username,
        permission: req.body.permission,
      });

      if (!result1.acknowledged)
        res.status(400).send("Error updating repository.");

      let result = await repositories.updateOne(filter, {
        $push: { accessList: req.body },
      });

      if (!result.acknowledged)
        res.status(400).send("Error updating repository.");
      else res.status(200).send("Updated successfully.");
    } catch (err) {
      console.log(err);
    }
  },
);

router.put("/:repo_name/removeUser", async (req: Request, res: Response) => {
  const client = new MongoClient(mongoURI);
  try {
    const { username, repo_name } = req.params;

    const GIT_DAMN = client.db("GIT_DAMN");
    const repositories = GIT_DAMN.collection("repositories");

    const filter = {
      name: repo_name,
      owner: username,
    };

    const repo = await repositories.findOne(filter);

    if (!repo) {
      res.status(400).send("Repository does not exist under user.");
      return;
    }

    if (
      repo.accessList
        .map((al: any) => al.username)
        .indexOf(req.body.username) === -1
    ) {
      res.status(400).send("User is not on the access list.");
      return;
    }

    const result = await repositories.updateOne(filter, {
      $pull: { accessList: req.body },
    });

    if (!result.acknowledged)
      res.status(400).send("Error updating repository.");
    else res.status(200).send("Updated successfully.");
  } catch (err) {
    console.log(err);
    res.status(400).send("There was an error adding the rpository.");
  } finally {
    await client.close();
  }
});

router.put(
  "/:repo_name/changeVisibility",
  async (req: Request, res: Response) => {
    const client = new MongoClient(mongoURI);
    try {
      const { username, repo_name } = req.params;

      const GIT_DAMN = client.db("GIT_DAMN");
      const repositories = GIT_DAMN.collection("repositories");

      const filter = {
        name: repo_name,
        owner: username,
      };

      const repo = await repositories.findOne(filter);

      if (!repo) {
        res.status(400).send("Repository does not exist under user");
        return;
      }

      const result = await repositories.updateOne(filter, {
        $set: {
          visibility: repo.visibility === "private" ? "public" : "private",
        },
      });

      if (!result.acknowledged)
        res.status(400).send("Error updating repository");
      else res.status(200).send("Updated successfully");
    } catch (err) {
      console.log(err);
      res.status(400).send("There was an error adding the rpository.");
    } finally {
      await client.close();
    }
  },
);

router.put(
  "/:repo_name/changeOwnership",
  async (req: Request, res: Response) => {
    const client = new MongoClient(mongoURI);
    try {
      const { username, repo_name } = req.params;

      const GIT_DAMN = client.db("GIT_DAMN");
      const repositories = GIT_DAMN.collection("repositories");
      const users = GIT_DAMN.collection("users");

      const filter = {
        name: repo_name,
        owner: username,
      };

      const repo = await repositories.findOne(filter);

      if (!repo) {
        res.status(400).send("Repository does not exist under user");
        return;
      }

      const target_username = req.body.target_username;

      const target_user = await users.findOne({ username: target_username });

      if (!target_user) {
        res
          .status(400)
          .send(`Target user (${target_username}) does not exist.`);
        return;
      }

      const target_filter = {
        name: repo_name,
        owner: target_username,
      };

      const target_repo = await repositories.findOne(target_filter);

      if (target_repo) {
        res
          .status(400)
          .send(
            "Repository already exists under target user: " + target_username,
          );
        return;
      }

      const result = await repositories.updateOne(filter, {
        $set: { owner: target_username },
      });

      if (!result.acknowledged)
        res.status(400).send("Error updating repository");
      else {
        const old_repo_path = path.join(
          global.repos_location,
          username,
          repo_name,
        );
        const new_repo_path = path.join(
          global.repos_location,
          target_username,
          repo_name,
        );
        await fsPromises.rename(old_repo_path, new_repo_path);
        res.status(200).send("Updated successfully");
      }
    } catch (err) {
      console.log(err);
      res.status(400).send("There was an error adding the repository.");
    } finally {
      await client.close();
    }
  },
);

router.put("/:repo_name/changeName", async (req: Request, res: Response) => {
  const client = new MongoClient(mongoURI);
  try {
    const { username, repo_name } = req.params;

    const GIT_DAMN = client.db("GIT_DAMN");
    const repositories = GIT_DAMN.collection("repositories");

    const filter_current = {
      name: repo_name,
      owner: username,
    };

    let new_repo_name: string = req.body.name;

    if (!new_repo_name.endsWith(".git")) new_repo_name += ".git";

    const filter_new = {
      name: new_repo_name,
      owner: username,
    };

    const new_repo = await repositories.findOne(filter_new);

    if (new_repo) {
      res
        .status(400)
        .send(`Repository with name "${new_repo_name}" already exists.`);
      return;
    }

    const current_repo = await repositories.findOne(filter_current);

    if (!current_repo) {
      res.status(400).send("Repository does not exist under user");
      return;
    }

    const result = await repositories.updateOne(filter_current, {
      $set: { name: new_repo_name },
    });

    if (!result.acknowledged)
      res.status(400).send("Error updating repository name");
    else {
      const old_repo_path = path.join(
        global.repos_location,
        username,
        repo_name,
      );
      const new_repo_path = path.join(
        global.repos_location,
        username,
        new_repo_name,
      );
      await fsPromises.rename(old_repo_path, new_repo_path);
      res.status(200).send("Updated successfully");
    }
  } catch (err) {
    console.log(err);
    res.status(400).send("There was an error adding the rpository.");
  } finally {
    await client.close();
  }
});

export default router;

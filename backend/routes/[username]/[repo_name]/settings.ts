import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { Repository } from '../../../models/Repository';
import { User } from '../../../models/User';

const fsPromises = fs.promises;
const router = express.Router({ mergeParams: true });

router.put("/addUser", async (req: Request, res: Response) => {
  try {
    const body = req.body as { username: string; permission: string };
    const user_to_add = await User.findOne(
        { username: body.username }
    );

    if (!user_to_add) {
        return res.status(400).send("User to add does not exist.");
    }
    
    const { repo } = req;

    if (!repo) {
      res.status(400).send("Repository does not exist under user.");
      return;
    }

    if (
      repo.accessList.map((al) => al.user).includes(user_to_add?._id)
    ) {
      res.status(400).send("User is already on the access list.");
      return;
    }

    repo.accessList.push(body);
    await repo.save();
    res.status(200).send("Updated successfully.");
  } catch (err) {
    console.log(err);
    res.status(400).send("There was an error adding the rpository.");
  }
});

router.put(
  "/changeUserPermission",
  async (req: Request, res: Response) => {
    try {
      const body_al = req.body as { username: string; permission: "read" | "write" };

      const repo = req.repo;

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

      const user_to_update = await User.findOne({ username: body_al.username });

      if (!user_to_update) {
        return res.status(400).send("User to update does not exist.");
      }

      repo.accessList.forEach((al) => {
        if (al.user.toString() === user_to_update._id.toString()) {
          al.permission = body_al.permission;
        }
      });

      await repo.save();
      res.status(200).send("Updated successfully.");
    } catch (err) {
      console.log(err);
    }
  },
);

router.put("/removeUser", async (req: Request, res: Response) => {
  try {
    const repo = req.repo;

    const user_to_remove = await User.findOne({ username: req.body.username });

    if (!user_to_remove) {
      return res.status(400).send("User to remove does not exist.");
    }

    const index_to_remove = repo.accessList
        .map((al) => al.user)
        .indexOf(user_to_remove._id);

    if (index_to_remove === -1)
      return res.status(400).send("User is not on the access list.");

    repo.accessList.splice(index_to_remove, 1);

    await repo.save();
    res.status(200).send("Updated successfully.");
  } catch (err) {
    console.log(err);
    res.status(400).send("There was an error adding the rpository.");
  }
});

router.put(
  "/changeVisibility",
  async (req: Request, res: Response) => {
    try {
      const { username, repo_name } = req.params;

      const filter = {
        name: repo_name,
        owner: username,
      };

      const repo = await Repository.findOne(filter);

      if (!repo) {
        res.status(400).send("Repository does not exist under user");
        return;
      }

      const result = await Repository.updateOne(filter, {
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
    }
  },
);

router.put(
  "/changeOwnership",
  async (req: Request, res: Response) => {
    try {
      const { username, repo_name } = req.params;

      const filter = {
        name: repo_name,
        owner: username,
      };

      const repo = await Repository.findOne(filter);

      if (!repo) {
        res.status(400).send("Repository does not exist under user");
        return;
      }

      const target_username = req.body.target_username;

      const target_user = await User.findOne({ username: target_username });

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

      const target_repo = await Repository.findOne(target_filter);

      if (target_repo) {
        res
          .status(400)
          .send(
            "Repository already exists under target user: " + target_username,
          );
        return;
      }

      const result = await Repository.updateOne(filter, {
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
    }
  },
);

router.put("/changeName", async (req: Request, res: Response) => {
  try {
    const { username, repo_name } = req.params;

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

    const new_repo = await Repository.findOne(filter_new);

    if (new_repo) {
      res
        .status(400)
        .send(`Repository with name "${new_repo_name}" already exists.`);
      return;
    }

    const current_repo = await Repository.findOne(filter_current);

    if (!current_repo) {
      res.status(400).send("Repository does not exist under user");
      return;
    }

    const result = await Repository.updateOne(filter_current, {
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
    res.status(400).send("There was an error updating the repository name.");
  }
});
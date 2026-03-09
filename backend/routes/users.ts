import express, { Request, Response } from "express";
import { ObjectId } from "bson";
import { User } from '../models/User';

const router = express.Router();

router.get("", async (_req: Request, res: Response) => {
  try {
    const options = {
      projection: { _id: 1, email: 1, username: 1, role: 1, repositories: 1 },
    };
    const users = User.find({}, options);
    if ((await User.countDocuments({})) === 0) {
      res.status(400).send("No documents found!");
      return;
    }
    res.json(users);
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const query = { _id: new ObjectId(req.params.id) };
    const result = await User.deleteOne(query);

    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
});

export default router;

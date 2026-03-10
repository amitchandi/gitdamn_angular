import { HydratedDocument, InferSchemaType } from "mongoose";
import { repositorySchema } from "../models/Repository";
import { AuthPayload } from "./index";

type IRepository = InferSchemaType<typeof repositorySchema>;

declare global {
  namespace Express {
    interface Request {
      user: AuthPayload;
      repo: HydratedDocument<IRepository>;
    }
  }
}

export {};
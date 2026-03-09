import { Schema, model } from 'mongoose';

export const repositorySchema = new Schema({
  name: { type: String, required: true },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  visibility: { type: String, enum: ['private', 'public'], required: true },
  description: { type: String, required: true },
  accessList: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['read', 'write'] }
  }],
});

export const Repository = model('Repository', repositorySchema);
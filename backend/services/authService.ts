import { User } from '../models/User';
import bcrypt from 'bcrypt';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export async function authenticateUser(username: string, password: string) {
    const query = { username: username };
    const user = await User.findOne(query);
    if (!user) throw new AuthError("Invalid credentials");

    var match = await bcrypt.compare(password, user.password);
    if (!match) throw new AuthError("Invalid credentials");

    return user;
}
import { JwtPayload } from 'jsonwebtoken';

interface AuthPayload extends JwtPayload {
    user_id: string;
    username: string;
    role: string;
}
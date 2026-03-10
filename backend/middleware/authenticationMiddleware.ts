import { Request, Response, NextFunction } from 'express';
import jwt, { Jwt, JwtPayload, VerifyCallback, VerifyErrors } from 'jsonwebtoken';
import { Repository } from '../models/Repository';
import { AuthPayload } from '../types';


function verifyJWT(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ message: 'Not authenticated, token not available' });

    jwt.verify(token, process.env.JWT_SECRET, (err: VerifyErrors | null, decodedToken: JwtPayload | string | undefined) => {
        if (err) {
            return res.status(401).json({ message: 'Not authenticated' });
        } else if (!decodedToken) {
            return res.status(401).json({ message: 'invalid token' });
        } else {
            req.user = decodedToken as AuthPayload;
            next();
        }
    });
}

function adminAuth(req: Request, res: Response, next: NextFunction) {
    if (req.user?.role !== 'admin') {
        return res.status(401).json({ message: "Not authorized" });
    } else {
        next();
    }
}

async function loadRepo(req: Request, res: Response, next: NextFunction) {
    const { repo_name } = req.params;
    const repo = await Repository.findOne({ owner: req.user.user_id, name: repo_name });
    if (!repo) return res.status(404).json({ error: "Repo not found" });
    req.repo = repo;
    next();
}

function requireRepoAccess(req: Request, res: Response, next: NextFunction) {
    const { repo } = req;
    const requestingUser = req.user.user_id;
    if (repo?.visibility === "public") return next();

    const isOwner = repo?.owner.toString() === requestingUser;
    const isAllowed = repo?.accessList.some(al => al.user?.toString() === requestingUser);

    if (!isOwner && !isAllowed) {
        return res.status(404).json({ error: "Repo not found" }); // 404 not 403 — don't reveal it exists
    }
    next();
}

function requireRepoOwner(req: Request, res: Response, next: NextFunction) {
  const requestingUser = req.user.username;
  if (req.repo?.owner.toString() !== requestingUser) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

export {
    verifyJWT,
    adminAuth,
    loadRepo,
    requireRepoAccess,
    requireRepoOwner,
}